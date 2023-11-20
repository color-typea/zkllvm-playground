import { promises as fs } from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import { CircuitInput } from '../test/circuit_input';
import { CmdlineHelper } from './cmdline_helper';
import { LogLevels } from './logging';

const CUR_DIR = __dirname;
const PROJECT_DIR = path.dirname(CUR_DIR);

const PROOF_GENERATOR = path.join(PROJECT_DIR, '../proof-producer/build/bin/proof-generator', 'proof-generator');
const ASSIGNER = path.join(PROJECT_DIR, '../zkllvm/build/bin/assigner', 'assigner');

export class ProofGeneratorCLIProofProducer extends CmdlineHelper {

    private files: Array<string> = [];

    constructor(
        private circuit_bytecode: string,
        private proofProducerBin: string = PROOF_GENERATOR,
        private assignerBin: string = ASSIGNER,
    ) {
        super(LogLevels.PROOF_GENERATOR);
    }

    private genRunArgsV2(crct: string, assignmentTable: string, outputFile: string, skipVerification: boolean): string[] {
        return [
            ...this.flattenNamedArgs({
                '--proof': outputFile,
                '--circuit': crct,
                '--assignment-table': assignmentTable,
            }),
            skipVerification ? '--skip-verification' : ''
        ];
    }

    /**
     * Proof files are written as 0x-prefixed hex string, so we need to convert it back to "raw bytes"
     * @param rawData 
     */
    private readProofFile(rawData: string): Buffer {
        return Buffer.from(rawData.slice(2), 'hex');
        // return Buffer.from(rawData, 'hex');
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

    _genRunAssignerArgs(
        inputFileName: string,
        crctFileName: string,
        tblFileName: string,
    ): string[] {
        return this.flattenNamedArgs({
            "--bytecode": this.circuit_bytecode,
            "--public-input": inputFileName,
            "--assignment-table": tblFileName,
            "--circuit": crctFileName,
            "--elliptic-curve-type": "pallas"
        });
    }

    async _runAssigner(
        proofInput: CircuitInput,
        inputFileName?: string
    ): Promise<{ crct: string, assignmentTable: string }> {
        const inputFile = inputFileName ?? (await this._createTempFile('input', 'json'));
        const crct = await this._createTempFile('circuit', 'crct');
        const tbl = await this._createTempFile('circuit', 'tbl');
        const input = proofInput.serializeFullForProofGen();
        await fs.writeFile(inputFile, JSON.stringify(input));

        const runArgs: string[] = this._genRunAssignerArgs(inputFile, crct, tbl);
        this.logger.info('Invoking assigner');
        this.logger.debug('Running proof generator', runArgs);
        return this.runCommand(this.assignerBin, runArgs)
            .then(() => { return { crct, assignmentTable: tbl }; })
            .catch((err) => {
                throw new Error(`Failed to run assigner ${err}`);
            });
    }

    async generateProof(
        proofInput: CircuitInput,
        skipVerification: boolean = false,
        inputFileName?: string,
        proofFileName?: string,
    ): Promise<Buffer> {
        const proofFile = proofFileName ?? (await this._createTempFile('proof', 'bin'));
        const { crct, assignmentTable } = await this._runAssigner(proofInput, inputFileName);
        const runArgs = this.genRunArgsV2(crct, assignmentTable, proofFile, skipVerification);
        this.logger.info('Invoking proof generator');
        this.logger.debug("Running proof generator", runArgs);
        return this.runCommand(this.proofProducerBin, runArgs)
            .then(async () => await fs.readFile(proofFile, 'utf8'))
            .then(data => this.readProofFile(data))
            .catch((err) => {
                throw new Error(`Failed to run proof generator ${err}`);
            });
    }

    async cleanup(): Promise<void> {
        await Promise.all(this.files.map(file => fs.unlink(file)));
        this.files = [];
    }
}

