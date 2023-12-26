import "@nomicfoundation/hardhat-toolbox/network-helpers";
import { TestRunner} from "./test_utils";
import { BigNumberish } from "ethers";
import { Uint, uint64 } from "solidity-math";
import {expect} from "chai";
import BN from "bn.js";
import { CircuitInput, InputBase } from "../utils/circuit_input";

class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public a: Uint,
        public expected: Uint,
    ) {
        super();
    }

    serializePublicForProofGen(): any[] {
        return [
            CircuitInputClass.asInt(this.expected)
        ];
    }

    serializePrivateForProofGen(): any[] {
        const result = [
            CircuitInputClass.asInt(this.a),
        ];
        return result;
    }

    serializePublicForContract(): BigNumberish[] {
        return [this.expected.bn.toString()];
    }
}

function inverseEndianness(value: Uint): Uint {
    const buf = value.bn.toBuffer('be', 8);
    const result = uint64(buf.reverse());
    return result;
}

// Note: runner performs setup initialization and ensures compilation/assignment/etc. is run exactly once for all tests
const runner = new TestRunner('endianness');

describe(runner.circuitName, async function () {       
    describe("valid input", async function () {
        const tests = [
            ["0000000000000001", "0100000000000000"],
            ["0000000000000010", "1000000000000000"],
            ["0000000000000102", "0201000000000000"],
            ["0102030405060708", "0807060504030201"],
        ];

        for (const test of tests) { 
            const [value, reversed] = test;
            const label = `changeEndianness(${value}) == ${reversed}`;
            it(label, async () => {
                //sanity check
                const valUint = uint64(new BN(value, 'hex', 'be'));
                const reversedUint = uint64(new BN(reversed, 'hex', 'be'));
                expect(inverseEndianness(valUint).toString(16)).to.equal(reversedUint.toString(16));
                const input = new CircuitInputClass(valUint, reversedUint);
               
                await runner.runTest(input, {returnValue: true});
            });
        }
    });

    describe("invalid input", async function () {
        const tests = [
            ["0000000000000001", "1000000000000000"],
            ["0000000000000001", "0000000000000001"],
            ["0000000000000010", "0000000000000001"],
        ];
        
        for (const test of tests) {
            const [value, reversed] = test;
            const label = `changeEndianness(${value}) == ${reversed}`
            it(label, async () => {
                //sanity check
                const valUint = uint64(new BN(value, 'hex', 'le'));
                const reversedUint = uint64(new BN(reversed, 'hex', 'le'));
                expect(inverseEndianness(valUint)).to.equal(reversedUint);
                const input = new CircuitInputClass(valUint, reversedUint);
                
                await runner.runTest(input, {returnValue: false});
            });
        }
    });
});