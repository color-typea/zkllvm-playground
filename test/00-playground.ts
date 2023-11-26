import "@nomicfoundation/hardhat-toolbox/network-helpers";
import {prepareTest, CircuitInput, InputBase, runTest, computeSHA256Hash, uint256ToBuffer32} from "./test_utils";
import { BigNumberish } from "ethers";
import { uint256 } from "solidity-math";

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



describe("Playground", async function () {
    const circuit = 'playground';
    const fixture = `${circuit}_fixture`;
    const contractName = `${circuit}_contract`;

    // DO NOT await here - mocha does not work nicely with async/await in describe
    // So we're creating a single await'able here, and await in all tests.
    // Only the first one will actually be awaited, everything else will resolve immediately
    const setupPromise = prepareTest(circuit, fixture);
        
    describe("valid input", async function () {
       it("runs successfully", async () => {
            // const a = uint256(255);
            const a = uint256(255).shln(16*8).add(255);
            const b = uint256(0);
            const expected_hash = computeSHA256Hash(a, b);
            // const expected_hash = Buffer.from(
            //     '8a023a9e4affbb255a6b48ae85cc4a7d1a1b9e8e6809fe9e48535c01c1fc071a',
            //     'hex'
            // );
            const input = new CircuitInputClass(
                uint256ToBuffer32(a),
                uint256ToBuffer32(b),
                expected_hash
            );
            console.log("Proof", JSON.stringify(input.serializeFullForProofGen()));
            console.log("Verify", JSON.stringify(input.serializePublicForContract()));
            const compilationArtifacts = await setupPromise;
            await runTest(contractName, compilationArtifacts.compiledCicuit, input, {returnValue: true});
       });
    });
});