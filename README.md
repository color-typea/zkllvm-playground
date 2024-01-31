# ZKLLVM end-to-end playground

## External dependencies

This repo relies on [NilFoundation / zkllvm](https://github.com/NilFoundation/zkllvm), [NilFoundation / proof-producer](https://github.com/NilFoundation/proof-producer) and
[NilFoundation / proof-market-toolchain](https://github.com/NilFoundation/proof-market-toolchain)
to be checked out into sibling directories; compiler+assigner+transpiler and proof-generator built according to the instructions in those repositories.

Alternatively, if those executables are available elsewhere, you can adjust corresponding settings in [utils/zkllvm_pipeline.ts](utils/zkllvm_pipeline.ts)

## Installation

* Install python3, node, npm, and npx.
* `make create-env` should do the rest

## Usage

At a very high level, this repository implements multiple end-to-end (from compiling a circuit to verifying a proof on EVM) tests excercising different building blocks of [lido-zkllvm-accounting-circuit][circuit]. 

[circuit]: https://github.com/color-typea/lido-zkllvm-accounting-circuit/blob/circuit_implementation/src/circuit.cpp

**Improtant note:** TL;DR after circuit change, run the test command two times, ignore the results of first run. 
Longer: At the moment, compiling+assigning+transpiling the circuit happens as part of the test setup. Unfortunately, there's a caveat - hardhat compiles solidity files **before** staring tests.
This leads to tests being executed against an "old" version of the EVM verifier - the one that exists just before the test command is executed (which is then overwritten by the test setup). 
The workaround is to just ignore the results of the first run after circuit change - the first run replaces the verifier, the second run actually executes the test against an updated verifier.

**Invocation**
* `npx hardhat test --parallel` - runs all tests. 
* `npx hardhat test tests/01-addition` - runs a single test

**Debugging:**

[utils/logging.ts](utils/logging.ts) contains logging configuration for different parts of the pipeline.

**Adding new circuits:**

Need to perform fours steps:

* Add a new circuit into `circuit` folder, following the naming convention (take a look at `circuit/01-addition` - should be self-explanatory)
* Add a new deploy to `deploy` folder (copy-paste existing one and adjust paths/names)
* Add new record to `utils/prepare_artifacts.ts` `AllCircuits` const.
* Add tests to `test` folder (check out `test/01-addition.ts` - should also be self-explanatory).