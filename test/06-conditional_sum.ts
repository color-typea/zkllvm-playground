import "@nomicfoundation/hardhat-toolbox/network-helpers";
import { uint256ToBuffer32, TestRunner} from "./test_utils";
import { BigNumberish } from "ethers";
import { Uint, uint256, uint64 } from "solidity-math";
import { CircuitInput, InputBase } from "../utils/circuit_input";

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

    serializePrivateForProofGen(): any[] {
        const result = [
            CircuitInputClass.asArray(this.values, InputBase.asInt),
            CircuitInputClass.asArray(this.keys, InputBase.asHash),
            CircuitInputClass.asHash(this.target_key),
        ];
        return result;
    }

    serializePublicForProofGen(): any[] {
        const result = [
            CircuitInputClass.asInt(this.expected_sum),
            CircuitInputClass.asInt(this.expected_count),
        ];
        return result;
    }

    serializePublicForContract(): BigNumberish[] {
        return [
            this.expected_sum.bn.toString(), 
            this.expected_count.bn.toString()
        ];
    }
}

// Note: runner performs setup initialization and ensures compilation/assignment/etc. is run exactly once for all tests
const runner = new TestRunner('conditional_sum');

const SIZE = 20;

const range = (start: number, stop: number, step: number = 1): Array<number> => {
    return Array.from({ length: (stop - start) / step }, (_, i) => start + (i * step));
}

describe(runner.circuitName, async function () {
    // DO NOT await here - mocha does not work nicely with async/await in describe
    // So we're creating a single await'able here, and await in all tests.
    // Only the first one will actually be awaited, everything else will resolve immediately
    const setupPromise = runner.prepareTest();
        
    describe("valid input", async function () {
        it("runs successfully", async () => {
            const elements = { total: SIZE, target: 7 }
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
            await runner.runTest(input, {returnValue: true});
       });
    });
});