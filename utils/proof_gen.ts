import { promises as fs } from 'fs';
import * as tmp from 'tmp';
import { CmdlineHelper } from './cmdline_helper';
import { LogLevels } from './logging';
import { CircuitInput } from './circuit_input';
import * as zkllvm_pipeline from './zkllvm_pipeline';

export interface IProofProducer {
    generateProof(
        proofInput: CircuitInput,
    ):  Promise<Buffer>;

    cleanup(): Promise<void>;
}


abstract class ProofProducerBase extends CmdlineHelper implements IProofProducer {
    abstract generateProof(
        proofInput: CircuitInput,
    ):  Promise<Buffer>;

    abstract cleanup(): Promise<void>;

    _readProofFromFile(proofFile: string): Promise<Buffer> {
        return fs.readFile(proofFile, 'utf8')
            .then(data => this._parseProof(data));
    }

    /**
     * Proof files are written as 0x-prefixed hex string, so we need to convert it back to "raw bytes"
     * @param rawData 
     */
    protected _parseProof(rawData: string): Buffer {
        return Buffer.from(rawData.slice(2), 'hex');
        // return Buffer.from(rawData, 'hex');
    }
}

export class PrecomputedProofProducer extends ProofProducerBase {
    constructor(
        private precomputedProofFile: string
    ) {
        super(LogLevels.PROOF_GENERATOR);
    }

    generateProof(
        proofInput: CircuitInput,
    ):  Promise<Buffer> {
        this.logger.info(`Reading proof from precomputed file ${this.precomputedProofFile}`);
        return this._readProofFromFile(this.precomputedProofFile);
    }

    cleanup(): Promise<void> {
        return Promise.resolve();
    }
}

export class ProofGeneratorCLIProofProducer extends ProofProducerBase {

    private files: Array<string> = [];

    constructor(
        private circuit_bytecode: string,
        private proofProducerBin: string = zkllvm_pipeline.PROOF_GENERATOR,
        private assignerBin: string = zkllvm_pipeline.ASSIGNER,
        private skipVerification: boolean = true
    ) {
        super(LogLevels.PROOF_GENERATOR);
    }

    _createTempFile(prefix: string, postfix: string): Promise<string> {
        return new Promise((resolve, reject) => {
            tmp.file({ prefix, postfix }, (err, path, fd) => {
                if (err) {
                    reject(err);
                }
                this.files.push(path);
                resolve(path);
            });
        });
    }

    private genRunArgsV2(crct: string, assignmentTable: string, outputFile: string): string[] {
        return [
            ...this.flattenNamedArgs({
                '--proof': outputFile,
                '--circuit': crct,
                '--assignment-table': assignmentTable,
            }),
            this.skipVerification ? '--skip-verification' : ''
        ];
    }

    _genRunAssignerArgs(
        publicInputFileName: string,
        privateInputFileName: string,
        crctFileName: string,
        tblFileName: string,
    ): string[] {
        return this.flattenNamedArgs({
            "--bytecode": this.circuit_bytecode,
            "--public-input": publicInputFileName,
            "--private-input": privateInputFileName,
            "--assignment-table": tblFileName,
            "--circuit": crctFileName,
            "--elliptic-curve-type": "pallas"
        });
    }

    async _runAssigner(
        proofInput: CircuitInput,
    ): Promise<{ crct: string, assignmentTable: string }> {
        const publicInputFile = await this._createTempFile('input', '_public.json');
        const privateInputFile = await this._createTempFile('input', '_public.json');
        const crct = await this._createTempFile('circuit', 'crct');
        const tbl = await this._createTempFile('circuit', 'tbl');
        const publicInput = JSON.stringify(proofInput.serializePublicForProofGen());
        const privateInput = JSON.stringify(proofInput.serializePrivateForProofGen());
        this.logger.debug("Public input", publicInput);
        this.logger.debug("Private input", privateInput);
        await fs.writeFile(publicInputFile, publicInput);
        await fs.writeFile(privateInputFile, privateInput);

        const runArgs: string[] = this._genRunAssignerArgs(publicInputFile, privateInputFile, crct, tbl);
        this.logger.info('Invoking assigner');
        return this.runCommand(this.assignerBin, runArgs)
            .then(() => { return { crct, assignmentTable: tbl }; })
            .catch((err) => {
                throw new Error(`Failed to run assigner ${err}`);
            });
    }

    async generateProof(
        proofInput: CircuitInput,
    ): Promise<Buffer> {
        const proofFile = await this._createTempFile('proof', 'bin');
        const { crct, assignmentTable } = await this._runAssigner(proofInput);
        const runArgs = this.genRunArgsV2(crct, assignmentTable, proofFile);
        this.logger.info('Invoking proof generator');
        return this.runCommand(this.proofProducerBin, runArgs)
            .then(async () => await this._readProofFromFile(proofFile))
            .catch((err) => {
                throw new Error(`Failed to run proof generator ${err}`);
            });
    }

    async cleanup(): Promise<void> {
        await Promise.all(this.files.map(file => fs.unlink(file)));
        this.files = [];
    }
}

