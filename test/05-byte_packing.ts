import "@nomicfoundation/hardhat-toolbox/network-helpers";
import { packUint64IntoSha256, TestRunner} from "./test_utils";
import { BigNumberish } from "ethers";
import { Uint, uint64 } from "solidity-math";
import { CircuitInput, InputBase } from "../utils/circuit_input";

class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public a: Uint,
        public b: Uint,
        public c: Uint,
        public d: Uint,
        public expected_hash: Buffer,
    ) {
        super();
    }

    serializePublicForProofGen(): any[] {
        return [
            CircuitInputClass.asHash(this.expected_hash)
        ];
    }

    serializePrivateForProofGen(): any[] {
        const result = [
            CircuitInputClass.asInt(this.a),
            CircuitInputClass.asInt(this.b),
            CircuitInputClass.asInt(this.c),
            CircuitInputClass.asInt(this.d)
        ];
        return result;
    }

    serializePublicForContract(): BigNumberish[] {
        return [];
    }
}

function testLabel(a: Uint, b: Uint, c: Uint, d: Uint, operand: string, hash: string) {
    return `pack(${a.toString(16)}, ${b.toString(16)}, ${c.toString(16)}, ${d.toString(16)}) ${operand} 0x${hash}`;
}

// Note: runner performs setup initialization and ensures compilation/assignment/etc. is run exactly once for all tests
const runner = new TestRunner('byte_packing')

describe(runner.circuitName, async function () {
    describe("valid input", async function () {
        const tests = [
            [1,2,3,4].map(v => uint64(v)),
            [256, 14, 9, 131].map(v => uint64(v)),
            [
                uint64(1).add(uint64(1).shln(60)),
                uint64(2).add(uint64(2).shln(60)),
                uint64(4).add(uint64(4).shln(60)),
                uint64(8).add(uint64(8).shln(60)),
            ]
        ];
        
        for (const test of tests) {
            const [a, b, c, d] = test;
            const expected_sha256 = packUint64IntoSha256(a, b, c, d);
            const label = testLabel(a, b, c, d, "==", expected_sha256.toString('hex'));
            it(label, async () => {
                const input = new CircuitInputClass(
                    a, b, c, d,
                    expected_sha256
                );
                await runner.runTest(input, {returnValue: true});
            });
        }
    });

    describe("invalid input", async function () {
        const tests = [
            [1,2,3,4].map(v => uint64(v)),
            [256, 14, 9, 131].map(v => uint64(v)),
            [
                uint64(1).add(uint64(1).shln(60)),
                uint64(2).add(uint64(2).shln(60)),
                uint64(4).add(uint64(4).shln(60)),
                uint64(8).add(uint64(8).shln(60)),
            ]
        ];
        
        for (const test of tests) {
            const [a, b, c, d] = test;
            const expected_sha256 = packUint64IntoSha256(uint64(0), uint64(0), uint64(0), uint64(1));
            const label = testLabel(a, b, c, d, "!=", expected_sha256.toString('hex'));
            it(label, async () => {
                const input = new CircuitInputClass(
                    a, b, c, d,
                    expected_sha256
                );
                await runner.runTest(input, {returnValue: false});
            });
        }
    });
});