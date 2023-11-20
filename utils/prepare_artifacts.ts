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
const ASSIGNER_BIN = path.join(ZKLLVM, "build/bin/assigner/assigner");
const TRANSPILER_BIN = path.join(ZKLLVM, "build/bin/transpiler/transpiler");

type CompiledCirctuitFile = string;

type CirtcuitArtifactsFolders = {
    circuitSource: string,
    development: string,
    proofGeneration: string,

    contracts: string
};

type SourceFolders = {
    circuit: string,
    input: string
};

export type CompilationArtifacts = {
    compiledCicuit: string,
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
            input: path.join(this.folders.circuitSource, `${this.circuitName}.inp`)
        };

        this.compilationArtifacts = {
            compiledCicuit: path.join(this.folders.development, `${this.circuitName}.ll`),
            assingmentTable: path.join(this.folders.development, `${this.circuitName}.tbl`),
            constraints: path.join(this.folders.development, `${this.circuitName}.crct`),

            tempGatesFolder: path.join(this.folders.development, `gates`),
            contractsGatesFolder: path.join(this.folders.contracts, 'gates'),
        };
    }

    private async ensurePaths(): Promise<void> {
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
            "./libs/stdlib/libc/include            ",
        ];
    }

    private async compileCircuit(): Promise<void> {
        const args = [
            ...this.arrayArg("-D", ["__ZKLLVM__"]),
            ...this.arrayArg("-I", this.compileIncludes()),
            "-emit-llvm", "-O1", "-S",
            ...this.flattenNamedArgs({
                "-target": "assigner",
                "-o": this.compilationArtifacts.compiledCicuit,
            }),
            this.sources.circuit
        ];
        this.logger.debug(`Compiling ${this.circuitName}`);
        return await this.runCommand(COMPILER_BIN, args, { cwd: ZKLLVM });
    }

    private assignCircuit(): Promise<void> {
        const args = this.flattenNamedArgs({
            "-b": this.compilationArtifacts.compiledCicuit,
            "-i": this.sources.input,
            "-t": this.compilationArtifacts.assingmentTable,
            "-c": this.compilationArtifacts.constraints,
            "-e": "pallas",
        });
        this.logger.debug(`Assigning ${this.circuitName}`);
        return this.runCommand(ASSIGNER_BIN, args, { cwd: ZKLLVM });
    }

    private async transpileCircuit(): Promise<void> {
        const args = [
            // -m gen-evm-verifier -i ${PUBLIC_INPUT} -t ${ASSIGNMENT_TABLE_FILE} -c ${CRCT_FILE} -o ${GATES_DIR} --optimize-gates
                ...this.flattenNamedArgs({
                "-m": "gen-evm-verifier",
                "-i": this.sources.input,
                "-t": this.compilationArtifacts.assingmentTable,
                "-c": this.compilationArtifacts.constraints,
                "-o": this.compilationArtifacts.tempGatesFolder,
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
        this.logger.debug(`Rewriting gates`);
        const dependenciesRegex = this.createReplaceRegexForGrep("../../", "@nilfoundation/evm-placeholder-verification/contracts/");
        const cmdDependencies = `find ${this.compilationArtifacts.tempGatesFolder} -type f -name *.sol -exec sed -i -e '${dependenciesRegex}' {} \\;`;
        await this.runCmd(cmdDependencies);

        const namingRegex = this.createReplaceRegexForGrep("_gates\\b", `_${this.circuitName}`);
        const cmdNaming = `find ${this.compilationArtifacts.tempGatesFolder} -type f -name *.sol -exec sed -i -e '${namingRegex}' {} \\;`;
        await this.runCmd(cmdNaming);
    }

    private async moveGates(): Promise<void> {
        this.logger.debug(`Moving gates`);
        this.logger.debug(`Moving gates from ${this.compilationArtifacts.tempGatesFolder} to ${this.compilationArtifacts.contractsGatesFolder}`)
        await this.deleteAllFilesInDir(this.compilationArtifacts.contractsGatesFolder);
        await this.moveAllFilesInDir(
            this.compilationArtifacts.tempGatesFolder,
            this.compilationArtifacts.contractsGatesFolder
        );
    }

    async prepareArtifacts(): Promise<CompilationArtifacts> {
        try {
            this.logger.info(`[${this.circuitName}]: Ensuring paths`);
            await this.ensurePaths();
            this.logger.info(`[${this.circuitName}]: Compiling circuit`);
            await this.compileCircuit();
            this.logger.info(`[${this.circuitName}]: Assigning circuit`);
            await this.assignCircuit();
            this.logger.info(`[${this.circuitName}]: Transpiling circuit`);
            await this.transpileCircuit();
            this.logger.info(`[${this.circuitName}]: Rewriting generated gates`);
            await this.rewriteGates();
            this.logger.info(`[${this.circuitName}]: Moving gates to contracts folder`);
            await this.moveGates();
            return this.compilationArtifacts;
        } catch (err) {
            this.logger.error("Failed to prepare artifacts", err);
            return Promise.reject(err);
        }
    }
}

const AllCircuits = new Map([
    ['addition', new CircuitArtifactsFactory("01-addition", "addition")],
    ['multiplication', new CircuitArtifactsFactory("02-multiplication", "multiplication")],
]);

export {
    AllCircuits,
    CircuitArtifactsFactory
}