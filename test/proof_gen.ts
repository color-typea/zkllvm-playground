import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as tmp from 'tmp';

const CUR_DIR = __dirname;
const PROJECT_DIR = path.dirname(CUR_DIR);
const OUTPUT_DIR = path.join(PROJECT_DIR, 'output');

const PROOF_GENERATOR = path.join(PROJECT_DIR, '../proof-market-toolchain/build/bin/proof-generator', 'proof-generator');

const DEFAULT_STATEMENT = path.join(OUTPUT_DIR, 'proof-requester', 'circuit.json');

interface HashType {
    vector: { field: string }[];
}

abstract class InputBase {
    static asInt(val: number): { int: number } {
        return { int: val };
    }

    static asArray<T, TOut>(val: T[], mapper: (item: T) => TOut): { array: TOut[] } {
        const mappedValues = val.map(mapper);
        return { array: mappedValues };
    }

    static asVector<T, TOut>(val: Array<T>, mapper: (item: T) => TOut): { vector: TOut[] } {
        const mappedValues = val.map(mapper);
        return { vector: mappedValues };
    }

    static asHash(value: Buffer): HashType {
        const low = value.readUIntLE(0, 16);
        const high = value.readUIntLE(16, 16);
        return { vector: [{ field: low.toString() }, { field: high.toString() }] };
    }

    protected static truncate<T>(value: T[], maxLen?: number): T[] {
        if (maxLen !== undefined) {
            return value.slice(0, maxLen);
        }
        return value;
    }
}

export interface CircuitInput {
    a: number;
    b: number;
    sum: number;

    serializeFullForProofGen(): any[];
    serializePublicForContract(): any[]
}

export class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(public a: number, public b: number, public sum: number) {
        super();
    }

    serializeFullForProofGen(): any[] {
        return [
            InputBase.asInt(this.a),
            InputBase.asInt(this.b),
            InputBase.asInt(this.sum),
        ];
    }

    serializePublicForContract(): any[] {
        return [this.a, this.b, this.sum];
    }
}

export class ProofGeneratorCLIProofProducer {
    private static LOGGER = console;

    constructor(
        private proofProducerBin: string = PROOF_GENERATOR,
        private circuitStatementFile: string = DEFAULT_STATEMENT
    ) { }

    private flattenNamedArgs(namedArgs: Record<string, string>): string[] {
        return Object.entries(namedArgs).reduce<string[]>(
            (acc, [key, value]) => acc.concat([key, value]),
            []
        );
    }

    private genRunArgs(publicInputFile: string, outputFile: string): string[] {
        return [
            this.proofProducerBin,
            ...this.flattenNamedArgs({
                '--proof_out': outputFile,
                '--circuit_input': this.circuitStatementFile,
                '--public_input': publicInputFile,
            }),
        ];
    }

    /**
     * Proof files are written as 0x-prefixed hex string, so we need to convert it back to "raw bytes"
     * @param rawData 
     */
    private readProofFile(rawData: string): Buffer {
        return Buffer.from(rawData.slice(2), 'hex');
    }

    // generateProof(
    //     proofInput: CircuitInput,
    //     proofFileName: string = DEFAULT_PROOF
    // ): Promise<Buffer> {
    //     const file = path.join(OUTPUT_DIR, 'gates/proof.bin');
    //     return new Promise<Buffer>((resolve, reject) => {
    //         fs.readFile(file, 'utf8', (err, data) => {
    //             if (err) {
    //                 reject(err);
    //             } else {
    //                 resolve(this.readProofFile(data));
    //             }
    //         });
    //     });
    // }

    _createTempFile(prefix: string, postfix: string): Promise<string> {
        return new Promise((resolve, reject) => {
            tmp.file({ prefix, postfix}, (err, path, fd) => {
                if (err) {
                    reject(err);
                }
                resolve(path);
            });
        });
    }
    
    generateProof(
        proofInput: CircuitInput,
        inputFileName?: string,
        proofFileName?: string
    ): Promise<Buffer> {
        return new Promise<Buffer>(async (resolve, reject) => {
            ProofGeneratorCLIProofProducer.LOGGER.info('Invoking proof producer');

            const inputFile = inputFileName ?? (await this._createTempFile('input', 'json'));
            const proofFile = proofFileName ?? (await this._createTempFile('input', 'json'));

            const input = proofInput.serializeFullForProofGen();
            fs.writeFileSync(inputFile, JSON.stringify(input));

            const args = this.genRunArgs(inputFile, proofFile);
            // ProofGeneratorCLIProofProducer.LOGGER.info("Running proof generator", args);
            const cmd = args.join(' ');
            const process = childProcess.spawn(cmd, {
                shell: true,
                stdio: 'inherit',
            });

            process.on('error', (err) => {
                reject(err);
            });

            process.on('close', (code) => {
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
        });
    }
}
