import "@nomicfoundation/hardhat-toolbox/network-helpers";
import {prepareTest, CircuitInput, InputBase, runTest, packUint64IntoSha256} from "./test_utils";
import { BigNumberish } from "ethers";
import { Uint, uint64 } from "solidity-math";

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
            InputBase.asHash(this.expected_hash)
        ];
    }

    serializePrivateForProofGen(): any[] {
        const result = [
            InputBase.asInt(this.a),
            InputBase.asInt(this.b),
            InputBase.asInt(this.c),
            InputBase.asInt(this.d)
        ];
        return result;
    }

    serializePublicForContract(): BigNumberish[] {
        return [];
    }
}

function testLabel(a: Uint, b: Uint, c: Uint, d: Uint, hash: string) {
    return `pack(${a.toString(16)}, ${b.toString(16)}, ${c.toString(16)}, ${d.toString(16)}) == 0x${hash}`;
}

const circuit = 'byte_packing';
const fixture = `${circuit}_fixture`;
const contractName = `${circuit}_contract`;

describe(circuit, async function () {
    // DO NOT await here - mocha does not work nicely with async/await in describe
    // So we're creating a single await'able here, and await in all tests.
    // Only the first one will actually be awaited, everything else will resolve immediately
    const setupPromise = prepareTest(circuit, fixture);
        
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
            const label = testLabel(a, b, c, d, expected_sha256.toString('hex'));
            it(label, async () => {
                const input = new CircuitInputClass(
                    a, b, c, d,
                    expected_sha256
                );
                const compilationArtifacts = await setupPromise;
                await runTest(contractName, compilationArtifacts.compiledCicuit, input, {returnValue: true});
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
            const label = testLabel(a, b, c, d, expected_sha256.toString('hex'));
            it(label, async () => {
                const input = new CircuitInputClass(
                    a, b, c, d,
                    expected_sha256
                );
                const compilationArtifacts = await setupPromise;
                await runTest(contractName, compilationArtifacts.compiledCicuit, input, {returnValue: false});
            });
        }
    });
});