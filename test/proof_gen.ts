import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as tmp from 'tmp';
import { CircuitInput } from './circuit_input';

const CUR_DIR = __dirname;
const PROJECT_DIR = path.dirname(CUR_DIR);

const PROOF_GENERATOR = path.join(PROJECT_DIR, '../proof-producer/build/bin/proof-generator', 'proof-generator');
const ASSIGNER = path.join(PROJECT_DIR, '../zkllvm/build/bin/assigner', 'assigner');
const COMPILED_CIRCUIT = path.join(PROJECT_DIR, 'output/circuit-developer', 'circuit.ll');

const suppressSubprocessOutput = true;
const suppressLogging = true;

function empty() {}

export class ProofGeneratorCLIProofProducer {
    private static LOGGER = !suppressLogging ? console : { log: empty, info: empty, debug: empty };

    private files: Array<string> = [];

    private suppress_subprocess_output: boolean = true;

    constructor(
        private proofProducerBin: string = PROOF_GENERATOR,
        private assignerBin: string = ASSIGNER,
        private circuit_bytecode: string = COMPILED_CIRCUIT,
    ) { }

    private flattenNamedArgs(namedArgs: Record<string, string>): string[] {
        return Object.entries(namedArgs).reduce<string[]>(
            (acc, [key, value]) => acc.concat([key, value]),
            []
        );
    }

    private genRunArgsV2(crct: string, assignmentTable: string, outputFile: string, skipVerification: boolean): string[] {
        return [
            this.proofProducerBin,
            ...this.flattenNamedArgs({
                '--proof': outputFile,
                '--circuit': crct,
                '--assignment-table': assignmentTable,
            }),
            skipVerification ? '--skip-verification': ''
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
            tmp.file({ prefix, postfix}, (err, path, fd) => {
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
        return [
            this.assignerBin,
            ...this.flattenNamedArgs({
                "--bytecode": this.circuit_bytecode,
                "--public-input": inputFileName,
                "--assignment-table": tblFileName,
                "--circuit": crctFileName,
                "--elliptic-curve-type": "pallas"
            })
        ]
    }

    async _runAssigner(
        proofInput: CircuitInput,
        inputFileName?: string
    ): Promise<{crct: string, assignmentTable: string}> {
        return new Promise<{crct: string, assignmentTable: string}>(async (resolve, reject) => {
            const inputFile = inputFileName ?? (await this._createTempFile('input', 'json'));
            const crct = await this._createTempFile('circuit', 'crct');
            const tbl = await this._createTempFile('circuit', 'tbl');
            const input = proofInput.serializeFullForProofGen();
            fs.writeFileSync(inputFile, JSON.stringify(input));

            const runArgs = this._genRunAssignerArgs(inputFile, crct, tbl).join(' ');
            ProofGeneratorCLIProofProducer.LOGGER.info('Invoking assigner');
            ProofGeneratorCLIProofProducer.LOGGER.debug('Run args', runArgs);
            // reject(new Error(`Failed to run assigner - retcode 1`));
            const process = childProcess.spawn(runArgs, {
                shell: true,
                stdio: this.suppress_subprocess_output ? 'ignore' : 'inherit',
            });
            process.on('error', (err) => {
                reject(err);
            });
            process.on('close', (code, signal) => {
                if (signal) {
                    reject(`Assigner exited with signal ${signal}`);
                }
                if (code === 0) {
                    resolve({crct, assignmentTable: tbl});
                } else {
                    reject(new Error(`Failed to run assigner - retcode ${code}`));
                }
            });
        });

    }
    
    generateProof(
        proofInput: CircuitInput,
        skipVerification: boolean = false,
        inputFileName?: string,
        proofFileName?: string,
    ): Promise<Buffer> {
        return new Promise<Buffer>(async (resolve, reject) => {

            const proofFile = proofFileName ?? (await this._createTempFile('proof', 'bin'));
            try {
                const {crct, assignmentTable} = await this._runAssigner(proofInput, inputFileName);
                const runArgs = this.genRunArgsV2(crct, assignmentTable, proofFile, skipVerification).join(' ');
                ProofGeneratorCLIProofProducer.LOGGER.info('Invoking proof producer');
                ProofGeneratorCLIProofProducer.LOGGER.debug("Running proof generator", runArgs);
                const process = childProcess.spawn(runArgs, {
                    shell: true,
                    stdio: this.suppress_subprocess_output ? 'ignore' : 'inherit',
                });
                process.on('error', (err) => {
                    console.log("In error");
                    reject(err);
                });
    
    
                process.on('close', (code, signal) => {
                    if (signal) {
                        reject(`Proof generator exited with signal ${signal}`);
                    }
                    if (code === 0) {
                        fs.readFile(proofFile, 'utf8', (err, data) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(this.readProofFile(data));
                            }
                        });
                    } else {
                        reject(new Error(`Failed to run proof generator - retcode ${code}`));
                    }
                });

            } catch (err: any) {
                reject(err);
            }            
        });
    }

    cleanup(): void{
        for (const file of this.files) {
            fs.unlinkSync(file);
        }
        this.files = [];
    }
}
