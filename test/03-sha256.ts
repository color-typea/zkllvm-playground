import "@nomicfoundation/hardhat-toolbox/network-helpers";
import { computeSHA256Hash, uint256ToBuffer32, TestRunner} from "./test_utils";
import { Uint, uint256 } from "solidity-math";
import { BigNumberish } from "ethers";
import { CircuitInput, InputBase } from "../utils/circuit_input";

class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public a: Buffer,
        public b: Buffer,
        public expected_hash: Buffer,
    ) {
        super();
    }

    serializePrivateForProofGen(): any[] {
        const result = [
            CircuitInputClass.asHash(this.a),
            CircuitInputClass.asHash(this.b),
            CircuitInputClass.asHash(this.expected_hash),
        ];
        return result;
    }

    serializePublicForProofGen(): any[] {
        return [];
    }

    serializePublicForContract(): BigNumberish[] {
        return [];
    }
}

function testLabel(a: Uint, b: Uint, hash: string) {
    return `sha256(${a.toString(16)}, ${b.toString(16)}) == 0x${hash}`;
}

// Note: runner performs setup initialization and ensures compilation/assignment/etc. is run exactly once for all tests
const runner = new TestRunner('sha256');

describe(runner.circuitName, async function () {
    describe("valid input", async function () {
        // this produces a 1 in both high and low field elements in sha256 block
        const oneInBothFelts = uint256(255).shln(16*8).add(255);
        const tests = [
            {a: uint256(1), b: uint256(0)},
            {a: oneInBothFelts, b: uint256(0)},
            {a: uint256(1), b: uint256(1)},
            {a: oneInBothFelts, b: uint256(1)},

            {
                a: uint256("16507339364505767685707796512181655236330077571073020801870589322541997706161"),
                b: uint256(0)
            },
            {
                a: uint256("16507339364505767685707796512181655236330077571073020801870589322541997706161"),
                b: uint256("2113178988811938236050057805162746832726629554183761089971103915512850086688")
            },
        ];

        for (const test of tests) {
            const hash = computeSHA256Hash(test.a, test.b);
            const label = testLabel(test.a, test.b, hash.toString('hex'));
            it(label, async function() {
                this.timeout(300000);
                const input = new CircuitInputClass(
                    uint256ToBuffer32(test.a),
                    uint256ToBuffer32(test.b),
                    hash
                );
                await runner.runTest(input, {returnValue: true});
            });
        }
    });
    describe("invalid input", async function () {
        const tests = [
            {a: uint256(1), b: uint256(0)},
            {a: uint256(255).shln(16*8).add(255), b: uint256(0)},
        ];

        for (const test of tests) {
            const hash = computeSHA256Hash(uint256(2), uint256(0));
            const label = `sha256(${test.a.toString(16)}, ${test.b.toString(16)}) != 0x${hash.toString('hex')}`;
            it(label, async function() {
                const input = new CircuitInputClass(
                    uint256ToBuffer32(test.a),
                    uint256ToBuffer32(test.b),
                    hash
                );
                await runner.runTest(input, {returnValue: false});
            });
        }
    });
});