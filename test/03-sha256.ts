import "@nomicfoundation/hardhat-toolbox/network-helpers";
import {prepareTest, CircuitInput, InputBase, runTest, computeSHA256Hash, uint256ToBuffer32} from "./test_utils";
import {expect} from "chai";
import { Uint, uint256 } from "solidity-math";
import { BigNumberish } from "ethers";

class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public a: Buffer,
        public b: Buffer,
        public expected_hash: Buffer,
    ) {
        super();
    }

    serializeFullForProofGen(): any[] {
        const result = [
            InputBase.asHash(this.a),
            InputBase.asHash(this.b),
            InputBase.asHash(this.expected_hash),
        ];
        // console.log("Serialized for proof generator", JSON.stringify(result));
        return result;
    }

    serializePublicForContract(): BigNumberish[] {
        return [
            // '0x'+this.a.toString('hex'),
            // '0x'+this.b,
            // '0x'+this.expected_hash.toString('hex')
        ];
    }
}

function testLabel(a: Uint, b: Uint, hash: string) {
    return `sha256(${a.toString(16)}, ${b.toString(16)}) == 0x${hash}`;
}

describe("Sha256", async function () {
    const circuit = 'sha256';
    const fixture = `${circuit}_fixture`;
    const contractName = `${circuit}_contract`;

    // DO NOT await here - mocha does not work nicely with async/await in describe
    // So we're creating a single await'able here, and await in all tests.
    // Only the first one will actually be awaited, everything else will resolve immediately
    const setupPromise = prepareTest(circuit, fixture);
   
    
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
                const input = new CircuitInputClass(
                    uint256ToBuffer32(test.a),
                    uint256ToBuffer32(test.b),
                    hash
                );
                const compilationArtifacts = await setupPromise;
                await runTest(contractName, compilationArtifacts.compiledCicuit, input, {returnValue: true});
            });
        }
    });
    // describe("invalid input", async function () {
    //     const tests = [
    //         {a: uint256(1), b: uint256(0)},
    //         {a: uint256(255).shln(16*8).add(255), b: uint256(0)},
    //     ];

    //     for (const test of tests) {
    //         // This is sha256(2, 0)
    //         const hash = Buffer.from('8a023a9e4affbb255a6b48ae85cc4a7d1a1b9e8e6809fe9e48535c01c1fc071a', 'hex');
    //         const label = `sha256(${test.a.toString(16)}, ${test.b.toString(16)}) != 0x${hash.toString('hex')}`;
    //         it(label, async function() {
    //             const input = new CircuitInputClass(
    //                 uint256ToBuffer32(test.a),
    //                 uint256ToBuffer32(test.b),
    //                 hash
    //             );
    //             const compilationArtifacts = await setupPromise;
    //             await runTest(contractName, compilationArtifacts.compiledCicuit, input, {reverts: true});
    //         });
    //     }
    // });
});