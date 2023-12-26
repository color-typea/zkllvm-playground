import "@nomicfoundation/hardhat-toolbox/network-helpers";
import { BigNumberish } from "ethers";
import { CircuitInput, InputBase } from "../utils/circuit_input";
import { TestRunner } from "./test_utils";

export class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public a: number,
        public b: number,
        public sum: number,
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
            CircuitInputClass.asInt(this.sum),
        ];
    }

    serializePublicForContract(): BigNumberish[] {
        return [
            this.sum,
        ];
    }
}

// Note: runner performs setup initialization and ensures compilation/assignment/etc. is run exactly once for all tests
const runner = new TestRunner('addition');

describe(runner.circuitName, async function () {   
    describe("valid input", async function () {
        const tests = [
            {label: "1 + 2 = 3", input: new CircuitInputClass(1, 2, 3)},
            {label: "100 + 351 = 451", input: new CircuitInputClass(100, 351, 451)},
        ]        

        for (const test of tests) {
            const {label, input} = test;
            it(label, async function() {
                await runner.runTest(input, {returnValue: true});
            });
        }
    });
    describe("invalid input", async function () {
        const tests = [
            {label: "1 + 1 = 3", input: new CircuitInputClass(1, 1, 3)},
            {label: "2 + 5 = 12", input: new CircuitInputClass(2, 5, 13)},
        ]

        for (const test of tests) {
            const {label, input} = test;
            it(label, async function() {
                await runner.runTest(input, {returnValue: false});
            });
        }
    });
});