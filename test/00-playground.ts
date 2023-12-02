import "@nomicfoundation/hardhat-toolbox/network-helpers";
import {prepareTest, CircuitInput, InputBase, runTest, computeSHA256Hash, uint256ToBuffer32, packUint64IntoSha256} from "./test_utils";
import { BigNumberish } from "ethers";
import { Uint, uint256 } from "solidity-math";

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

    serializeFullForProofGen(): any[] {
        const result = [
            InputBase.asInt(this.a),
            InputBase.asInt(this.b),
            InputBase.asInt(this.c),
            InputBase.asInt(this.d),
            InputBase.asHash(this.expected_hash),
        ];
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

const circuit = 'playground';
const fixture = `${circuit}_fixture`;
const contractName = `${circuit}_contract`;

describe(circuit, async function () {
    // DO NOT await here - mocha does not work nicely with async/await in describe
    // So we're creating a single await'able here, and await in all tests.
    // Only the first one will actually be awaited, everything else will resolve immediately
    const setupPromise = prepareTest(circuit, fixture);
        
    describe("valid input", async function () {
       it("runs successfully", async () => {
            const a = uint256(1);
            const b = uint256(2);
            const c = uint256(3);
            const d = uint256(4);
            const expected_sha256 = packUint64IntoSha256(a, b, c, d);
            const input = new CircuitInputClass(
                a, b, c, d,
                expected_sha256
            );
            const compilationArtifacts = await setupPromise;
            await runTest(contractName, compilationArtifacts.compiledCicuit, input, {returnValue: true});
       });
    });
});