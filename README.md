# ZKLLVM end-to-end playground

## External dependencies

This repo relies on [NilFoundation / zkllvm](https://github.com/NilFoundation/zkllvm) and
[NilFoundation / proof-market-toolchain](https://github.com/NilFoundation/proof-market-toolchain)
to be checked out into sibling directories; compiler+assigner+transpiler and proof-generator built according to the instructions in those repositories.

Alternatively, if those executables are available elsewhere, you can adjust corresponding settings (or targets) in the Makefile.

## Installation

* Install python3, node, npm, and npx.
* `make create-env` should do the trick