import "@nomicfoundation/hardhat-toolbox/network-helpers";
import { TestRunner} from "./test_utils";
import { BigNumberish } from "ethers";
import { CircuitInput, InputBase } from "../utils/circuit_input";

class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public a: number,
        public b: number,
        public mul: number,
    ) {
        super();
    }

    serializePrivateForProofGen(): any[] {
        return [
            CircuitInputClass.asInt(this.a),
            CircuitInputClass.asInt(this.b),
        ];
    }

    serializePublicForProofGen(): any[] {
        return [
            CircuitInputClass.asInt(this.mul),
        ];
    }

    serializePublicForContract(): BigNumberish[] {
        return [
            this.mul,
        ];
    }
}

// Note: runner performs setup initialization and ensures compilation/assignment/etc. is run exactly once for all tests
const runner = new TestRunner('multiplication');

describe(runner.circuitName, async function () {  
    describe("valid input", async function () {
        const tests = [
            {label: "1 * 2 = 2", input: new CircuitInputClass(1, 2, 2)},
            {label: "15 * 7 = 105", input: new CircuitInputClass(15, 7, 105)},
        ];

        for (const test of tests) {
            const {label, input} = test;
            it(label, async function() {
                await runner.runTest(input, {returnValue: true});
            });
        }
    });
    describe("invalid input", async function () {
        const tests = [
            {label: "1 * 2 = 3", input: new CircuitInputClass(1, 2, 3)},
            {label: "2 * 5 = 12", input: new CircuitInputClass(2, 5, 12)},
        ]

        for (const test of tests) {
            const {label, input} = test;
            it(label, async function() {
                await runner.runTest(input, {returnValue: false});
            });
        }
    });
});