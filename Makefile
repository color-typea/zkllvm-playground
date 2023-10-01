PROJECT_DIR:=$(abspath .)
PROJECT_NAME:=circuit

SRC_DIR=${PROJECT_DIR}/circuit
OUTPUT_DIR=${PROJECT_DIR}/output
PUBLIC_INPUT=${SRC_DIR}/${PROJECT_NAME}.inp
COMPILED_CIRCUIT=${OUTPUT_DIR}/${PROJECT_NAME}.ll
CRCT_FILE=${OUTPUT_DIR}/${PROJECT_NAME}.crct
ASSIGNMENT_TABLE_FILE=${OUTPUT_DIR}/${PROJECT_NAME}.tbl
STATEMENT_FILE=${OUTPUT_DIR}/${PROJECT_NAME}.json
GATES_DIR=${OUTPUT_DIR}/gates

CONTRACTS_DIR=${PROJECT_DIR}/contracts

ZKLLVM=${PROJECT_DIR}/../zkllvm
PROOF_MARKET=${PROJECT_DIR}/../proof-market-toolchain
PYTHON_VIRTUALENV=~/.venvs/zkllvm-playground

mkoutput:
	mkdir -p output

create-virtualenv:
	virtualenv -p python3 ${PYTHON_VIRTUALENV}
	. ${PYTHON_VIRTUALENV}/bin/activate; pip install -r requirements.txt

install-node-dependencies:
	npm install

create-env: install-node-dependencies create-virtualenv

circuit-build: mkoutput
	cd ${ZKLLVM} && ./build/libs/circifier/llvm/bin/clang-16 -target assigner -D__ZKLLVM__ -I./libs/crypto3/libs/algebra/include -I./build/include -I/usr/local/include -I -I./libs/crypto3/libs/block/include -I/usr/local/include -I./libs/blueprint/include -I./libs/crypto3/libs/codec/include -I./libs/crypto3/libs/containers/include -I./libs/crypto3/libs/hash/include -I./libs/crypto3/libs/kdf/include -I./libs/crypto3/libs/mac/include -I./libs/crypto3/libs/marshalling/core/include -I./libs/crypto3/libs/marshalling/algebra/include -I./libs/crypto3/libs/marshalling/multiprecision/include -I./libs/crypto3/libs/marshalling/zk/include -I./libs/crypto3/libs/math/include -I./libs/crypto3/libs/modes/include -I./libs/crypto3/libs/multiprecision/include -I./libs/crypto3/libs/passhash/include -I./libs/crypto3/libs/pbkdf/include -I./libs/crypto3/libs/threshold/include -I./libs/crypto3/libs/pkpad/include -I./libs/crypto3/libs/pubkey/include -I./libs/crypto3/libs/random/include -I./libs/crypto3/libs/stream/include -I./libs/crypto3/libs/vdf/include -I./libs/crypto3/libs/zk/include -I./libs/stdlib/libcpp -I./libs/stdlib/libc/include -emit-llvm -O1 -S -o ${COMPILED_CIRCUIT} ${SRC_DIR}/circuit.cpp

circuit-assign: mkoutput circuit-build
	cd ${ZKLLVM} && ./build/bin/assigner/assigner -b ${COMPILED_CIRCUIT} -i ${PUBLIC_INPUT} -t ${ASSIGNMENT_TABLE_FILE} -c ${CRCT_FILE} -e pallas

circuit-transpile: mkoutput circuit-assign
	rm -rf ${GATES_DIR} && mkdir -p ${GATES_DIR} && \
	cd ${ZKLLVM} && ./build/bin/transpiler/transpiler -m gen-gate-argument -i ${PUBLIC_INPUT} -t ${ASSIGNMENT_TABLE_FILE} -c ${CRCT_FILE} -o ${GATES_DIR} --optimize-gates

circuit-gen-circuit-params: circuit-assign
		cd ${ZKLLVM} && ./build/bin/transpiler/transpiler -m gen-test-proof -i ${PUBLIC_INPUT} -t ${ASSIGNMENT_TABLE_FILE} -c ${CRCT_FILE} -o ${GATES_DIR} --optimize-gates

codegen-circuit-params: circuit-gen-circuit-params
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 codegen/codegen_circuit_params.py

rewrite-gates: circuit-transpile
	sed -i 's_../../../contracts_@nilfoundation/evm-placeholder-verification/contracts_g' output/gates/gate_argument.sol

move-gates: circuit-transpile rewrite-gates
	rm -rf ${CONTRACTS_DIR}/gates
	cp -r ${GATES_DIR} ${CONTRACTS_DIR}/gates

prepare-statement: circuit-build
	. ${PYTHON_VIRTUALENV}/bin/activate && python3 ${PROOF_MARKET}/scripts/prepare_statement.py --circuit ${COMPILED_CIRCUIT} --name ${PROJECT_NAME} --type placeholder-zkllvm --private --output ${STATEMENT_FILE}

prepare-artifacts: circuit-transpile move-gates codegen-circuit-params prepare-statement

deploy: prepare_artifacts
	npx hardhat deploy

prepare-env: deploy prepare-statement

test: prepare-artifacts
	npx hardhat test
	