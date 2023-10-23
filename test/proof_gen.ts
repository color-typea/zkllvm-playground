import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as tmp from 'tmp';
import { uint32, uint256 } from "solidity-math";

const CUR_DIR = __dirname;
const PROJECT_DIR = path.dirname(CUR_DIR);
// const OUTPUT_DIR = path.join(PROJECT_DIR, 'output');

// const PROOF_GENERATOR = path.join(PROJECT_DIR, '../proof-market-toolchain/build/bin/proof-generator', 'proof-generator');
const PROOF_GENERATOR = path.join(PROJECT_DIR, '../proof-producer/build/bin/proof-generator', 'proof-generator');
const ASSIGNER = path.join(PROJECT_DIR, '../zkllvm/build/bin/assigner', 'assigner');
const COMPILED_CIRCUIT = path.join(PROJECT_DIR, 'output/circuit-developer', 'circuit.ll');

// const DEFAULT_STATEMENT = path.join(OUTPUT_DIR, 'proof-requester', 'circuit.json');

interface HashType {
    vector: { field: string }[];
}

function identity(x) { return x; }

function readUint128FromBuffer(buffer: Buffer, offset_bytes: number) {
    let result = uint256(0);
    result.ior(uint256(buffer.readUInt32LE(offset_bytes + 0)).shln(0));
    result.ior(uint256(buffer.readUInt32LE(offset_bytes + 4)).shln(4 * 8));
    result.ior(uint256(buffer.readUInt32LE(offset_bytes + 8)).shln(8 * 8));
    result.ior(uint256(buffer.readUInt32LE(offset_bytes + 12)).shln(12 * 8));
    return result;
}

abstract class InputBase {
    static asInt(val: number): { int: number } {
        return { int: val };
    }

    static asArray<T, TOut>(val: T[], mapper: (item: T) => TOut = identity): { array: TOut[] } {
        const mappedValues = val.map(mapper);
        return { array: mappedValues };
    }

    static asVector<T, TOut>(val: Array<T>, mapper: (item: T) => TOut = identity): { vector: TOut[] } {
        const mappedValues = val.map(mapper);
        return { vector: mappedValues };
    }

    static asHash(value: Buffer): HashType {
        const low = readUint128FromBuffer(value, 0);
        const high = readUint128FromBuffer(value, 16);
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
    actual_validator_count: number,
    validator_balances: Array<number>,
    expected_total_balance: number,
    expected_balances_hash: Buffer

    serializeFullForProofGen(): any[];
    serializePublicForContract(): any[]
}

export class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public actual_validator_count: number,
        public validator_balances: Array<number>,
        public expected_total_balance: number,
        public expected_balances_hash: Buffer
    ) {
        super();
    }

    serializeFullForProofGen(): any[] {
        return [
            InputBase.asInt(this.actual_validator_count),
            InputBase.asArray(this.validator_balances, (x) => { return {"int": x};}),
            InputBase.asInt(this.expected_total_balance),
            InputBase.asHash(this.expected_balances_hash),
        ];
    }

    serializePublicForContract(): any[] {
        return [
            InputBase.asInt(this.actual_validator_count),
            InputBase.asArray(this.validator_balances, (x) => x),
            InputBase.asInt(this.expected_total_balance),
            InputBase.asHash(this.expected_balances_hash),
        ];
    }
}

export class ProofGeneratorCLIProofProducer {
    private static LOGGER = console;

    constructor(
        private proofProducerBin: string = PROOF_GENERATOR,
        private assignerBin: string = ASSIGNER,
        private circuit_bytecode: string = COMPILED_CIRCUIT,
        // private circuitStatementFile: string = DEFAULT_STATEMENT
    ) { }

    private flattenNamedArgs(namedArgs: Record<string, string>): string[] {
        return Object.entries(namedArgs).reduce<string[]>(
            (acc, [key, value]) => acc.concat([key, value]),
            []
        );
    }

    // private genRunArgs(publicInputFile: string, outputFile: string): string[] {
    //     return [
    //         this.proofProducerBin,
    //         ...this.flattenNamedArgs({
    //             '--proof_out': outputFile,
    //             '--circuit_input': this.circuitStatementFile,
    //             '--public_input': publicInputFile,
    //         }),
    //     ];
    // }

    private genRunArgsV2(crct: string, assignmentTable: string, outputFile: string): string[] {
        return [
            this.proofProducerBin,
            ...this.flattenNamedArgs({
                '--proof': outputFile,
                '--circuit': crct,
                '--assignment-table': assignmentTable,
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
                stdio: 'inherit',
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
        inputFileName?: string,
        proofFileName?: string
    ): Promise<Buffer> {
        return new Promise<Buffer>(async (resolve, reject) => {

            const proofFile = proofFileName ?? (await this._createTempFile('proof', 'bin'));
            try {
                const {crct, assignmentTable} = await this._runAssigner(proofInput, inputFileName);
                const runArgs = this.genRunArgsV2(crct, assignmentTable, proofFile).join(' ');
                ProofGeneratorCLIProofProducer.LOGGER.info('Invoking proof producer');
                ProofGeneratorCLIProofProducer.LOGGER.debug("Running proof generator", runArgs);
                const process = childProcess.spawn(runArgs, {
                    shell: true,
                    stdio: 'inherit',
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
}
