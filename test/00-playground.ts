import "@nomicfoundation/hardhat-toolbox/network-helpers";
import {prepareTest, CircuitInput, InputBase, runTest, computeSHA256Hash, uint256ToBuffer32, packUint64IntoSha256} from "./test_utils";
import { BigNumberish } from "ethers";
import { Uint, uint256, uint64 } from "solidity-math";

class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public values: Array<Uint>,
        public keys: Array<Buffer>,
        public target_key: Buffer,
        public expected_sum: Uint,
        public expected_count: Uint,
    ) {
        super();
    }

    serializeFullForProofGen(): any[] {
        const result = [
            InputBase.asArray(this.values, InputBase.asInt),
            InputBase.asArray(this.keys, InputBase.asHash),
            InputBase.asHash(this.target_key),
            InputBase.asInt(this.expected_sum),
            InputBase.asInt(this.expected_count),
        ];
        return result;
    }

    serializePublicForContract(): BigNumberish[] {
        return [
            // this.expected_sum.bn.toString(), 
            // this.expected_count.bn.toString()
        ];
    }
}

const circuit = 'playground';
const fixture = `${circuit}_fixture`;
const contractName = `${circuit}_contract`;

const SIZE = 20;

const range = (start: number, stop: number, step: number = 1): Array<number> => {
    return Array.from({ length: (stop - start) / step }, (_, i) => start + (i * step));
}

describe(circuit, async function () {
    // DO NOT await here - mocha does not work nicely with async/await in describe
    // So we're creating a single await'able here, and await in all tests.
    // Only the first one will actually be awaited, everything else will resolve immediately
    const setupPromise = prepareTest(circuit, fixture);
        
    describe("valid input", async function () {
        it("runs successfully", async () => {
            const elements = { total: 20, target: 7 }
            const values = range(0, elements.total);
            const keyValues = {
                target: uint256ToBuffer32(uint256(1).shln(248)),
                other: uint256ToBuffer32(uint256(0))
            }
            const keys = Array.from({length: elements.target}, () => keyValues.target)
                .concat(Array.from({length: elements.total - elements.target}, () => keyValues.other));
            const expected_sum = values.slice(0, elements.target).reduce((acc, val) => acc + val);
            const expected_count = elements.target;
            const input = new CircuitInputClass(
                values.map(val => uint64(val)), 
                keys, 
                keyValues.target, 
                uint64(expected_sum), uint64(expected_count)
            );
            const compilationArtifacts = await setupPromise;
            await runTest(contractName, compilationArtifacts.compiledCicuit, input, {returnValue: true});
       });
    });
});