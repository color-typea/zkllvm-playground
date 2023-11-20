import "@nomicfoundation/hardhat-toolbox/network-helpers";
import {prepareTest, CircuitInput, InputBase, runTest, computeSHA256Hash, uint256ToBuffer32} from "./test_utils";
import {expect} from "chai";
import { uint256 } from "solidity-math";
import { BigNumberish, ethers } from "ethers";
import { DataHexString, HexString } from "ethers/lib.commonjs/utils/data";

class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public a: DataHexString,
        public b: DataHexString,
        public expected_hash: DataHexString,
    ) {
        super();
    }

    serializeFullForProofGen(): any[] {
        const result = [
            InputBase.hexStringAsHash(this.a),
            InputBase.hexStringAsHash(this.b),
            InputBase.hexStringAsHash(this.expected_hash),
        ];
        // console.log("Serialized for proof generator", JSON.stringify(result));
        return result;
    }

    serializePublicForContract(): BigNumberish[] {
        return [
            '0x'+this.a,
            '0x'+this.b,
            '0x'+this.expected_hash
        ];
    }

    getReport(): object {
        return { expected_hash: '0x'+this.expected_hash };
    }
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
        const tests = [
            {a: uint256(1), b: uint256(0), hashed: '16abab341fb7f370e27e4dadcf81766dd0dfd0ae64469477bb2cf6614938b2af'},
            // {a: uint256(1), b: uint256(2), hashed: 'ff55c97976a840b4ced964ed49e3794594ba3f675238b5fd25d282b60f70a194'},
            // {a: uint256(255).add(uint256(255).shln(16 * 8)), b: uint256(255), hashed: '7509c974164b248d5094a8adb4d1bd6a4641969693f650658160c08f028527bf'},
        ];

        for (const test of tests) {
            const label = `sha256(${test.a}, ${test.b}) == ${test.hashed}`;
            it(label, async function() {
                const compilationArtifacts = await setupPromise;
                expect(computeSHA256Hash(test.a, test.b)).to.be.equal(test.hashed);
                const input = new CircuitInputClass(
                    uint256ToBuffer32(test.a).toString('hex'),
                    uint256ToBuffer32(test.b).toString('hex'),
                    test.hashed,
                );
                await runTest(contractName, compilationArtifacts.compiledCicuit, input, {returnValue: true});
            });
        }
    });
    // describe("invalid input", async function () {
    //     const tests = [
    //         {label: "1 * 2 = 3", input: new CircuitInputClass(1, 2, 3)},
    //         {label: "2 * 5 = 12", input: new CircuitInputClass(2, 5, 12)},
    //     ]

    //     for (const test of tests) {
    //         const {label, input} = test;
    //         it(label, async function() {
    //             const compilationArtifacts = await setupPromise;
    //             await runTest(contractName, compilationArtifacts.compiledCicuit, input, {reverts: true});
    //         });
    //     }
    // });
});