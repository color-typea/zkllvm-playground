# ZKLLVM end-to-end playground

## External dependencies

This repo relies on [NilFoundation / zkllvm](https://github.com/NilFoundation/zkllvm) and
[NilFoundation / proof-market-toolchain](https://github.com/NilFoundation/proof-market-toolchain)
to be checked out into sibling directories; compiler+assigner+transpiler and proof-generator built according to the instructions in those repositories.

Alternatively, if those executables are available elsewhere, you can adjust corresponding settings (or targets) in the Makefile.

## Installation

* Install python3, node, npm, and npx.
* `make create-env` should do the rest

## What to do

Most of the operations are captured as Makefile commands. A few most relevant ones

* `make test` - does everything and runs tests.
* `make prepare-env` - generates all artifacts (incl. circuit statement) and deploys all the contracts. Needs hardhat node running (`npx hardhat node`) separately.
* `make prepare-artifacts` - generates all artifacts: compiles, assigns and transpiles the circuit, generates CircuitParams.sol and circuit statement, rewrites gates to use installed evm-placeholder-verifier and moves them to `contracts/gates`.