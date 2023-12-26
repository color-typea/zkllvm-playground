import * as childProcess from 'child_process';
import * as path from 'path';
import { CmdlineHelper } from './cmdline_helper';
import { LogLevels } from './logging';
import {promises as fs} from 'fs';

const PROJECT_DIR = path.dirname(__dirname);
const SRC_DIR=path.join(PROJECT_DIR, "circuit");
const OUTPUT_DIR=path.join(PROJECT_DIR, "output");
const CONTRACTS_DIR=path.join(PROJECT_DIR, "contracts");

const ZKLLVM=path.join(PROJECT_DIR, "../zkllvm");
const PROOF_MARKET=path.join(PROJECT_DIR, "../proof-market-toolchain");
const PROOF_GENERATOR_FOLDER=path.join(PROJECT_DIR, "../proof-producer");
const EVM_PLACEHOLDER_VERIFICATION=path.join(PROJECT_DIR, "../evm-placeholder-verification");

const CIRCUIT_DEVELOPER_DIR=path.join(OUTPUT_DIR, "circuit-developer");
const PROOF_REQUESTER_DIR=path.join(OUTPUT_DIR, "proof-requester");
const PROOF_PRODUCER_DIR=path.join(OUTPUT_DIR, "proof-producer");


const COMPILER_BIN = path.join(ZKLLVM, "build/libs/circifier/llvm/bin/clang-16");
const LINKER_BIN = path.join(ZKLLVM, "build/libs/circifier/llvm/bin/llvm-link");
const ASSIGNER_BIN = path.join(ZKLLVM, "build/bin/assigner/assigner");
const TRANSPILER_BIN = path.join(ZKLLVM, "build/bin/transpiler/transpiler");

type CirtcuitArtifactsFolders = {
    circuitSource: string,
    development: string,
    proofGeneration: string,

    contracts: string
};

type SourceFolders = {
    circuit: string,
    publicInput: string
    privateInput: string
};

type AssignerInput = {
    "-b": string,
    "-i": string,
    "-t": string,
    "-c": string,
    "-e": string,
    "-p"?: string
}

export type CompilationArtifacts = {
    compiledCircuit: string,
    compiledCircuitNoStdlib: string,
    assingmentTable: string,
    constraints: string,

    tempGatesFolder: string,
    contractsGatesFolder: string
};

class CircuitArtifactsFactory extends CmdlineHelper {
    private folders: CirtcuitArtifactsFolders;
    private sources: SourceFolders;
    private compilationArtifacts: CompilationArtifacts;

    constructor(private pathSuffix: string, private circuitName: string) {
        super(LogLevels.ARTIFACTS);
        const sanitizedSuffixForContracts = `c${this.pathSuffix.replace('-', '_')}`;

        this.folders = {
            circuitSource: path.join(SRC_DIR, this.pathSuffix),
            development: path.join(CIRCUIT_DEVELOPER_DIR, this.pathSuffix),
            proofGeneration: path.join(PROOF_PRODUCER_DIR, this.pathSuffix),

            contracts: path.join(CONTRACTS_DIR, sanitizedSuffixForContracts),
        };

        this.sources = {
            circuit: path.join(this.folders.circuitSource, `${this.circuitName}.cpp`),
            publicInput: path.join(this.folders.circuitSource, `${this.circuitName}_public.inp`),
            privateInput: path.join(this.folders.circuitSource, `${this.circuitName}_private.inp`)
        };

        this.compilationArtifacts = {
            compiledCircuit: path.join(this.folders.development, `${this.circuitName}.ll`),
            compiledCircuitNoStdlib: path.join(this.folders.development, `${this.circuitName}_no_stdlib.ll`),
            assingmentTable: path.join(this.folders.development, `${this.circuitName}.tbl`),
            constraints: path.join(this.folders.development, `${this.circuitName}.crct`),

            tempGatesFolder: path.join(this.folders.development, `gates`),
            contractsGatesFolder: path.join(this.folders.contracts, 'gates'),
        };
    }

    private async ensurePaths(): Promise<void> {
        this.logger.info(`[${this.circuitName}]: Ensuring paths`);
        const paths = [
            this.folders.development, this.folders.proofGeneration, 
            this.compilationArtifacts.tempGatesFolder, this.compilationArtifacts.contractsGatesFolder
        ];
        await Promise.all(paths.map(path => fs.mkdir(path, { recursive: true })));
    } 

    private compileIncludes(): string[] {
        return [
            "./libs/crypto3/libs/algebra/include",
            "./build/include",
            "/usr/local/include",
            "./libs/crypto3/libs/block/include",
            "/usr/local/include",
            "./libs/blueprint/include",
            "./libs/crypto3/libs/codec/include",
            "./libs/crypto3/libs/containers/include",
            "./libs/crypto3/libs/hash/include",
            "./libs/crypto3/libs/kdf/include",
            "./libs/crypto3/libs/mac/include",
            "./libs/crypto3/libs/marshalling/core/include",
            "./libs/crypto3/libs/marshalling/algebra/include",
            "./libs/crypto3/libs/marshalling/multiprecision/include",
            "./libs/crypto3/libs/marshalling/zk/include",
            "./libs/crypto3/libs/math/include",
            "./libs/crypto3/libs/modes/include",
            "./libs/crypto3/libs/multiprecision/include",
            "./libs/crypto3/libs/passhash/include",
            "./libs/crypto3/libs/pbkdf/include",
            "./libs/crypto3/libs/threshold/include",
            "./libs/crypto3/libs/pkpad/include",
            "./libs/crypto3/libs/pubkey/include",
            "./libs/crypto3/libs/random/include",
            "./libs/crypto3/libs/stream/include",
            "./libs/crypto3/libs/vdf/include",
            "./libs/crypto3/libs/zk/include",
            "./libs/stdlib/libcpp",
            "./libs/circifier/clang/lib/Headers",
            "./libs/stdlib/libc/include",
        ];
    }

    private async compileCircuit(): Promise<void> {
        this.logger.info(`[${this.circuitName}]: Compiling circuit`);
        const args = [
            ...this.arrayArg("-D", ["__ZKLLVM__", "_LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION"]),
            ...this.arrayArg("-I", this.compileIncludes()),
            "-emit-llvm", "-O1", "-S", "-Xclang", "-fpreserve-vec3-type", "-Werror=unknown-attributes",
            ...this.flattenNamedArgs({
                "-target": "assigner",
                "-o": this.compilationArtifacts.compiledCircuitNoStdlib,
            }),
            this.sources.circuit
        ];
        this.logger.debug(`Compiling ${this.circuitName}`);
        return await this.runCommand(COMPILER_BIN, args, { cwd: ZKLLVM });
    }

    private linkDependencies(): string[] {
        const dependencies = [
            "./build/libs/stdlib/libc/zkllvm-libc.ll",
            "./build/libs/stdlib/libcpp/zkllvm-libcpp.ll"
        ];
        this.logger.warn(`[${this.circuitName}]: Using dependecies ${dependencies} - make sure they exist and up to date`);
        return dependencies
    }

    private async linkCircuit(): Promise<void> {
        this.logger.info(`[${this.circuitName}]: Linking circuit`);
        const args = [
            "-S",
            ...this.flattenNamedArgs({"-o": this.compilationArtifacts.compiledCircuit}),
            this.compilationArtifacts.compiledCircuitNoStdlib,
            ...this.linkDependencies()
        ];
        this.logger.debug(`Linking ${this.circuitName}`);
        await this.runCommand(LINKER_BIN, args, { cwd: ZKLLVM });
    }

    private async assignCircuit(): Promise<void> {
        this.logger.info(`[${this.circuitName}]: Assigning circuit`);
        const argsObj: AssignerInput = {
            "-b": this.compilationArtifacts.compiledCircuit,
            "-i": this.sources.publicInput,
            "-t": this.compilationArtifacts.assingmentTable,
            "-c": this.compilationArtifacts.constraints,
            "-e": "pallas",
        };
        if (await this.fileExists(this.sources.privateInput)) {
            argsObj['-p'] = this.sources.privateInput;
        }
        const args = this.flattenNamedArgs(argsObj);
        this.logger.debug(`Assigning ${this.circuitName}`);
        return this.runCommand(ASSIGNER_BIN, args, { cwd: ZKLLVM });
    }

    private async transpileCircuit(): Promise<void> {
        this.logger.info(`[${this.circuitName}]: Transpiling circuit`);
        const args = [
            // -m gen-evm-verifier -i ${PUBLIC_INPUT} -t ${ASSIGNMENT_TABLE_FILE} -c ${CRCT_FILE} -o ${GATES_DIR} --optimize-gates
                ...this.flattenNamedArgs({
                "-m": "gen-evm-verifier",
                "-i": this.sources.publicInput,
                "-t": this.compilationArtifacts.assingmentTable,
                "-c": this.compilationArtifacts.constraints,
                "-o": this.compilationArtifacts.tempGatesFolder,
                "-e": "pallas",
            }),
            "--optimize-gates"
        ];
        this.logger.debug(`Transpiling ${this.circuitName}`);
        return this.runCommand(TRANSPILER_BIN, args, { cwd: ZKLLVM });
    }

    private createReplaceRegexForGrep(whatToReplace: string, replacement: string): string {
        const sanitize = (term: string) => term.replaceAll('/', "\\/");
        return `s/${sanitize(whatToReplace)}/${sanitize(replacement)}/g`
    }

    private async rewriteGates(): Promise<void> {
        this.logger.info(`[${this.circuitName}]: Rewriting generated gates`);
        const dependenciesRegex = this.createReplaceRegexForGrep("../../", "@nilfoundation/evm-placeholder-verification/contracts/");
        const cmdDependencies = `find ${this.compilationArtifacts.tempGatesFolder} -type f -name *.sol -exec sed -i -e '${dependenciesRegex}' {} \\;`;
        await this.runCmd(cmdDependencies);

        const namingRegex = this.createReplaceRegexForGrep("_gates\\b", `_${this.circuitName}`);
        const cmdNaming = `find ${this.compilationArtifacts.tempGatesFolder} -type f -name *.sol -exec sed -i -e '${namingRegex}' {} \\;`;
        await this.runCmd(cmdNaming);
    }

    private async moveGates(): Promise<void> {
        this.logger.info(`[${this.circuitName}]: Moving gates to contracts folder`);
        this.logger.debug(`Moving gates from ${this.compilationArtifacts.tempGatesFolder} to ${this.compilationArtifacts.contractsGatesFolder}`)
        await this.deleteAllFilesInDir(this.compilationArtifacts.contractsGatesFolder);
        await this.moveAllFilesInDir(
            this.compilationArtifacts.tempGatesFolder,
            this.compilationArtifacts.contractsGatesFolder
        );
    }

    async prepareArtifacts(): Promise<CompilationArtifacts> {
        try {
            await this.ensurePaths();
            await this.compileCircuit();
            await this.linkCircuit();
            await this.assignCircuit();
            await this.transpileCircuit();
            await this.rewriteGates();
            await this.moveGates();
            return this.compilationArtifacts;
        } catch (err) {
            this.logger.error("Failed to prepare artifacts", err);
            return Promise.reject(err);
        }
    }
}

type CircuitNames = 'playground' | 'addition' | 'multiplication' | 'sha256' | 'endianness' | 'byte_packing' | 'conditional_sum';

const AllCircuits: Map<CircuitNames, CircuitArtifactsFactory> = new Map([
    ['playground', new CircuitArtifactsFactory("00-playground", "playground")],
    ['addition', new CircuitArtifactsFactory("01-addition", "addition")],
    ['multiplication', new CircuitArtifactsFactory("02-multiplication", "multiplication")],
    ['sha256', new CircuitArtifactsFactory("03-sha256", "sha256")],
    ['endianness', new CircuitArtifactsFactory("04-endianness", "endianness")],
    ['byte_packing', new CircuitArtifactsFactory("05-byte_packing", "byte_packing")],
    ['conditional_sum', new CircuitArtifactsFactory("06-conditional_sum", "conditional_sum")],
]);

export {
    AllCircuits,
    CircuitNames,
    CircuitArtifactsFactory
}