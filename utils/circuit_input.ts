import { BigNumberish } from "ethers";
import BN from "bn.js";
import { Uint, uint128 } from "solidity-math";
import "@nomicfoundation/hardhat-toolbox/network-helpers";

export abstract class InputBase {
    static asInt(val: number | Uint): { int: number | string } {
        if (typeof(val) === 'number') {
            return { int: val }
        } else {
            return { int: val.toString() };
        }
    }

    static asArray<T, TOut>(val: T[], mapper: (item: T) => TOut = identity): { array: TOut[] } {
        const mappedValues = val.map((val, _idx) => mapper(val));
        return { array: mappedValues };
    }

    static asVector<T, TOut>(val: Array<T>, mapper: (item: T) => TOut = identity): { vector: TOut[] } {
        const mappedValues = val.map((val, _idx) => mapper(val));
        return { vector: mappedValues };
    }

    static asHash(value: Buffer, flip: boolean = false): HashType {
        if (value.length != 32) { throw new Error(`Buffer must contain exactly 32 bytes, got ${value.length}`)};
        const endianness = 'be';
        const source = flip ? value.reverse() : value;
        return { vector: [
            { field: readUint128FromBuffer(source,  0, endianness).toString() }, 
            { field: readUint128FromBuffer(source, 16, endianness).toString() }
        ] };
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
    serializePublicForProofGen(): any[];
    serializePrivateForProofGen(): any[];
    serializePublicForContract(): BigNumberish[]
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
