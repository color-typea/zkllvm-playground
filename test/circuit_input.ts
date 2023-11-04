import { uint256 } from "solidity-math";


interface HashType {
    vector: { field: string }[];
}

function identity(x: any) { return x; }

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
    values: Array<number>
    expectedSum: number

    serializeFullForProofGen(): any[];
    serializePublicForContract(): any[]
}

export class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public values: Array<number>,
        public expectedSum: number,
    ) {
        super();
    }

    serializeFullForProofGen(): any[] {
        return [
            InputBase.asArray(this.values, InputBase.asInt),
            InputBase.asInt(this.expectedSum),
        ];
    }

    serializePublicForContract(): any[] {
        // return [
        //     this.values,
        //     this.expectedSum
        // ];
        return [];
    }
}