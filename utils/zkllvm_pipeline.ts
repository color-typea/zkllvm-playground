import * as path from 'path';

const CUR_DIR = __dirname;
const PROJECT_DIR = path.dirname(CUR_DIR);

const ZKLLVM=path.join(PROJECT_DIR, "../zkllvm");
const PROOF_GENERATOR_FOLDER=path.join(PROJECT_DIR, "../proof-producer");

const PROOF_GENERATOR_VERSION = 'proof-generator-single-threaded';
// const PROOF_GENERATOR_VERSION = 'proof-generator-multi-threaded';

const COMPILER = path.join(ZKLLVM, "build/libs/circifier/llvm/bin/clang-17");
const LINKER = path.join(ZKLLVM, "build/libs/circifier/llvm/bin/llvm-link");
const ASSIGNER = path.join(ZKLLVM, "build/bin/assigner/assigner");
const TRANSPILER = path.join(ZKLLVM, "build/bin/transpiler/transpiler");
const PROOF_GENERATOR = path.join(PROOF_GENERATOR_FOLDER, '/build/bin/', 'proof-generator', PROOF_GENERATOR_VERSION);

export {
    ZKLLVM, COMPILER, LINKER, ASSIGNER, TRANSPILER, PROOF_GENERATOR
};