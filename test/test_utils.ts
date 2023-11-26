import * as hre from 'hardhat';
import { Uint, uint128, uint256 } from "solidity-math";
import {expect} from "chai";
import "@nomicfoundation/hardhat-toolbox/network-helpers";
import { createHash } from 'crypto';
import { BigNumberish } from 'ethers';
import { Hash } from 'crypto';


import { ProofGeneratorCLIProofProducer } from '../utils/proof_gen';
import { Contract } from "ethers";
import { getLogger, LogLevels } from "../utils/logging";
import { AllCircuits, CompilationArtifacts } from "../utils/prepare_artifacts";

export async function prepareTest(circuit: string, fixture: string): Promise<CompilationArtifacts> {
    const circuitArtifactsFactory = AllCircuits.get(circuit);
    if (circuitArtifactsFactory == null) {
        throw new Error(`Circuit artifacts factory for ${circuit} is not found`);
    }
    const artifacts =  await circuitArtifactsFactory.prepareArtifacts();
    await hre.deployments.fixture([fixture]);
    return artifacts;
}

interface HashType {
    vector: { field: string }[];
}

function identity(x: any) { return x; }

function readUint128FromBuffer(buffer: Buffer, offset_bytes: number, endianness: 'le' | 'be' = 'le') {
    let result = uint128(0);
    if (endianness === 'be') {
        result.ior(uint128(buffer.readUInt32BE(offset_bytes + 0)).shln(12 * 8));
        result.ior(uint128(buffer.readUInt32BE(offset_bytes + 4)).shln(8 * 8));
        result.ior(uint128(buffer.readUInt32BE(offset_bytes + 8)).shln(4 * 8));
        result.ior(uint128(buffer.readUInt32BE(offset_bytes + 12)).shln(0));
    } else {
        result.ior(uint128(buffer.readUInt32LE(offset_bytes + 0)).shln(0));
        result.ior(uint128(buffer.readUInt32LE(offset_bytes + 4)).shln(4 * 8));
        result.ior(uint128(buffer.readUInt32LE(offset_bytes + 8)).shln(8 * 8));
        result.ior(uint128(buffer.readUInt32LE(offset_bytes + 12)).shln(12 * 8));
    }
    return result;
}

export abstract class InputBase {
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

    static asHash(value: Buffer, flip: boolean = false): HashType {
        if (value.length != 32) { throw new Error(`Buffer must contain exactly 32 bytes, got ${value.length}`)};
        const endianness = 'be';
        const source = flip ? value.reverse() : value;
        const low = uint256(readUint128FromBuffer(source, 0, endianness));
        const high = uint256(readUint128FromBuffer(source, 16, endianness));
        return { vector: [{ field: low.toString() }, { field: high.toString() }] };
    }

    static hexStringAsHash(value: string): HashType {
        return this.asHash(Buffer.from(value, 'hex'));
    }

    protected static truncate<T>(value: T[], maxLen?: number): T[] {
        if (maxLen !== undefined) {
            return value.slice(0, maxLen);
        }
        return value;
    }
}

export interface CircuitInput {
    serializeFullForProofGen(): any[];
    serializePublicForContract(): BigNumberish[]
}

type TestOptions = { returnValue?: boolean, reverts?: boolean };

const LOGGER = getLogger(LogLevels.CONTRACT_INTERACTION);

export async function submitProof(contract: Contract, input: CircuitInput, zkProof: Buffer): Promise<boolean> {
    const proof = {
        public_input: input.serializePublicForContract(),
        zkProof: zkProof,
    };
    return await contract.submitReportData(proof, {gasLimit: 30_500_000});
}

export async function runTest(
    contractName: string,
    compiledCircuit: string,
    circuit_input: CircuitInput, 
    { returnValue = false, reverts = false }: TestOptions) {

    const proofProducer = new ProofGeneratorCLIProofProducer(compiledCircuit);
    const skipVerification = !returnValue;
    try {
        const Contract = await hre.ethers.getContract<Contract>(contractName);
        const zkProof = await proofProducer.generateProof(circuit_input, skipVerification);
        LOGGER.info("Submitting proof");
        const submission = submitProof(Contract, circuit_input, zkProof);
        if (reverts) {
            await expect(submission).to.be.revertedWithoutReason();
        } else {
            expect(await submission).to.equal(returnValue);
        }
    } finally {
        proofProducer.cleanup();
    }
}

export function uint256ToBuffer32(value: Uint, endianness: 'be' | 'le' = 'le'): Buffer {
    return value.bn.toBuffer(endianness, 32);
}

export function computeSHA256Hash(a: Uint, b: Uint): Buffer {
    const buffer = Buffer.concat([a.bn.toBuffer('le', 32), b.bn.toBuffer('le', 32)]);

    if (buffer.length != 64) { throw new Error(`Buffer should contain exactly 64 bytes, got ${buffer.length}`)};

    return createHash('sha256').update(buffer).digest();
}