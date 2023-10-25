PROJECT_DIR:=$(abspath .)
PROJECT_NAME:=circuit

SRC_DIR=${PROJECT_DIR}/circuit
OUTPUT_DIR=${PROJECT_DIR}/output

CIRCUIT_DEVELOPER_DIR=${OUTPUT_DIR}/circuit-developer
PROOF_REQUESTER_DIR=${OUTPUT_DIR}/proof-requester
PROOF_PRODUCER_DIR=${OUTPUT_DIR}/proof-producer

PUBLIC_INPUT=${SRC_DIR}/${PROJECT_NAME}.inp
PUBLIC_INPUT_BAD=${SRC_DIR}/${PROJECT_NAME}_bad.inp
COMPILED_CIRCUIT=${CIRCUIT_DEVELOPER_DIR}/${PROJECT_NAME}.ll
CRCT_FILE=${CIRCUIT_DEVELOPER_DIR}/${PROJECT_NAME}.crct
ASSIGNMENT_TABLE_FILE=${CIRCUIT_DEVELOPER_DIR}/${PROJECT_NAME}.tbl
GATES_DIR=${CIRCUIT_DEVELOPER_DIR}/gates

CIRCUIT_METADATA=${SRC_DIR}/circuit_metadata.json
STATEMENT_FILE=${PROOF_REQUESTER_DIR}/${PROJECT_NAME}.json
PROOF_BIN=${PROOF_REQUESTER_DIR}/${PROJECT_NAME}_proof.bin


CONTRACTS_DIR=${PROJECT_DIR}/contracts

ZKLLVM=${PROJECT_DIR}/../zkllvm
PROOF_MARKET=${PROJECT_DIR}/../proof-market-toolchain
PROOF_GENERATOR_FOLDER=${PROJECT_DIR}/../proof-producer
EVM_PLACEHOLDER_VERIFICATION=${PROJECT_DIR}/../evm-placeholder-verification
PYTHON_VIRTUALENV=~/.venvs/zkllvm-playground

# PROOF_GENERATOR=${PROOF_MARKET}/build/bin/proof-generator/proof-generator
PROOF_GENERATOR=${PROOF_GENERATOR_FOLDER}/build/bin/proof-generator/proof-generator

STATEMENT_KEY=119745395
REQUEST_KEY=119843892
PROPOSAL_KEY=119749487
COST=2
STATEMENT_FILE_FROM_PM=${PROOF_PRODUCER_DIR}/${PROJECT_NAME}_statement.json
PUBLIC_INPUT_FROM_PM=${PROOF_PRODUCER_DIR}/${PROJECT_NAME}_input.json
PROOF_FOR_PM=${PROOF_PRODUCER_DIR}/${PROJECT_NAME}_proof.bin

mkfolders:
	mkdir -p ${OUTPUT_DIR} ${PROOF_REQUESTER_DIR} ${PROOF_PRODUCER_DIR} ${CIRCUIT_DEVELOPER_DIR}

rm-gates:
	rm -f ${GATES_DIR}/*

rm-proof:
	rm -f ${PROOF_BIN}

create-virtualenv:
	virtualenv -p python3 ${PYTHON_VIRTUALENV}
	. ${PYTHON_VIRTUALENV}/bin/activate; pip install -r requirements.txt

install-node-dependencies:
	npm install

create-env: install-node-dependencies create-virtualenv

circuit-build: mkfolders
	cd ${ZKLLVM} && ./build/libs/circifier/llvm/bin/clang-16 -target assigner -D__ZKLLVM__ -I./libs/crypto3/libs/algebra/include -I./build/include -I/usr/local/include -I -I./libs/crypto3/libs/block/include -I/usr/local/include -I./libs/blueprint/include -I./libs/crypto3/libs/codec/include -I./libs/crypto3/libs/containers/include -I./libs/crypto3/libs/hash/include -I./libs/crypto3/libs/kdf/include -I./libs/crypto3/libs/mac/include -I./libs/crypto3/libs/marshalling/core/include -I./libs/crypto3/libs/marshalling/algebra/include -I./libs/crypto3/libs/marshalling/multiprecision/include -I./libs/crypto3/libs/marshalling/zk/include -I./libs/crypto3/libs/math/include -I./libs/crypto3/libs/modes/include -I./libs/crypto3/libs/multiprecision/include -I./libs/crypto3/libs/passhash/include -I./libs/crypto3/libs/pbkdf/include -I./libs/crypto3/libs/threshold/include -I./libs/crypto3/libs/pkpad/include -I./libs/crypto3/libs/pubkey/include -I./libs/crypto3/libs/random/include -I./libs/crypto3/libs/stream/include -I./libs/crypto3/libs/vdf/include -I./libs/crypto3/libs/zk/include -I./libs/stdlib/libcpp -I./libs/stdlib/libc/include -emit-llvm -O1 -S -o ${COMPILED_CIRCUIT} ${SRC_DIR}/circuit.cpp

circuit-assign: mkfolders circuit-build
	cd ${ZKLLVM} && ./build/bin/assigner/assigner -b ${COMPILED_CIRCUIT} -i ${PUBLIC_INPUT} -t ${ASSIGNMENT_TABLE_FILE} -c ${CRCT_FILE} -e pallas

circuit-assign-bad: mkfolders circuit-build
	cd ${ZKLLVM} && ./build/bin/assigner/assigner -b ${COMPILED_CIRCUIT} -i ${PUBLIC_INPUT_BAD} -t ${ASSIGNMENT_TABLE_FILE} -c ${CRCT_FILE} -e pallas

circuit-transpile: mkfolders rm-gates circuit-assign
	cd ${ZKLLVM} && ./build/bin/transpiler/transpiler -m gen-evm-verifier -i ${PUBLIC_INPUT} -t ${ASSIGNMENT_TABLE_FILE} -c ${CRCT_FILE} -o ${GATES_DIR} --optimize-gates

circuit-gen-test-proof: rm-proof
	cd ${ZKLLVM} && ./build/bin/transpiler/transpiler -m gen-test-proof -i ${PUBLIC_INPUT} -t ${ASSIGNMENT_TABLE_FILE} -c ${CRCT_FILE} -o ${GATES_DIR} --optimize-gates
	mv -f ${GATES_DIR}/proof.bin ${PROOF_BIN}

circuit-gen-circuit-params: circuit-assign
	cd ${ZKLLVM} && ./build/bin/transpiler/transpiler -m gen-circuit-params -i ${PUBLIC_INPUT} -t ${ASSIGNMENT_TABLE_FILE} -c ${CRCT_FILE} -o ${GATES_DIR} --optimize-gates

codegen-circuit-params: circuit-gen-circuit-params
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 codegen/codegen_circuit_params.py

rewrite-gates: circuit-transpile
	find ${GATES_DIR} -type f -name *.sol -exec	sed -i  -e 's_../../_@nilfoundation/evm-placeholder-verification/contracts/_g' {} \;

move-gates: circuit-transpile rewrite-gates
	rm -rf ${CONTRACTS_DIR}/gates
	cp -r ${GATES_DIR} ${CONTRACTS_DIR}/gates

prepare-statement: circuit-build
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/prepare_statement.py --circuit ${COMPILED_CIRCUIT} --type placeholder-zkllvm --private --output ${STATEMENT_FILE} --name ${PROJECT_NAME}

prepare-artifacts: circuit-transpile move-gates codegen-circuit-params prepare-statement

push-to-proof-market: prepare-statement
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/statement_tools.py push --file ${STATEMENT_FILE}

request-proof:
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/request_tools.py push --cost ${COST} --file ${PUBLIC_INPUT} --key ${STATEMENT_KEY}

check-request:
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/request_tools.py get --key ${REQUEST_KEY}

submit-proposal:
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/proposal_tools.py push --cost ${COST} --key ${STATEMENT_KEY}

check-proposal:
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/proposal_tools.py get --key ${PROPOSAL_KEY}

generate-proof-local: circuit-assign rm-proof
# ${PROOF_GENERATOR} --proof_out=${PROOF_BIN} --circuit_input=${STATEMENT_FILE} --public_input=${PUBLIC_INPUT}
	${PROOF_GENERATOR} --proof ${PROOF_BIN} --circuit ${CRCT_FILE} --assignment-table ${ASSIGNMENT_TABLE_FILE}

generate-proof-for-proof-market: mkfolders
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/statement_tools.py get --key ${STATEMENT_KEY} -o ${STATEMENT_FILE_FROM_PM}
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/public_input_get.py --key ${REQUEST_KEY} -o ${PUBLIC_INPUT_FROM_PM}
	${PROOF_GENERATOR} --proof_out=${PROOF_FOR_PM} --circuit_input=${STATEMENT_FILE_FROM_PM} --public_input=${PUBLIC_INPUT_FROM_PM}

submit-proof: generate-proof-for-proof-market
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/proof_tools.py push --request_key ${REQUEST_KEY} --proposal_key ${PROPOSAL_KEY} --file ${PROOF_FOR_PM}

get-proof-from-proof-market:
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/proof_tools.py get --request_key ${REQUEST_KEY} --file ${PROOF_BIN}

deploy: prepare_artifacts
	npx hardhat deploy

prepare-env: deploy prepare-statement

test-fast: 
	npx hardhat test
	
test: prepare-artifacts test-fast

test-in-evm-placeholder: rm-gates circuit-assign circuit-transpile generate-proof-local
	rm -f ${EVM_PLACEHOLDER_VERIFICATION}/contracts/zkllvm/gates/*
	cp ${GATES_DIR}/* ${EVM_PLACEHOLDER_VERIFICATION}/contracts/zkllvm/gates
	cp ${PROOF_BIN} ${EVM_PLACEHOLDER_VERIFICATION}/contracts/zkllvm/gates/proof.bin
	cd ${EVM_PLACEHOLDER_VERIFICATION} && npx hardhat deploy && npx hardhat verify-circuit-proof --test gates

test-in-evm-placeholder-bad: circuit-assign-bad generate-proof-local
	cp ${PROOF_BIN} ${EVM_PLACEHOLDER_VERIFICATION}/contracts/zkllvm/gates/proof.bin
	cd ${EVM_PLACEHOLDER_VERIFICATION} && npx hardhat deploy && npx hardhat verify-circuit-proof --test gates