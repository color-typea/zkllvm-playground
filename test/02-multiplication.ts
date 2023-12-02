import "@nomicfoundation/hardhat-toolbox/network-helpers";
import {prepareTest, CircuitInput, InputBase, runTest} from "./test_utils";
import { BigNumberish } from "ethers";

class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public a: number,
        public b: number,
        public mul: number,
    ) {
        super();
    }

    serializeFullForProofGen(): any[] {
        return [
            InputBase.asInt(this.a),
            InputBase.asInt(this.b),
            InputBase.asInt(this.mul),
        ];
    }

    serializePublicForContract(): BigNumberish[] {
        return [
            this.mul,
        ];
    }
}

const circuit = 'multiplication';
const fixture = `${circuit}_fixture`;
const contractName = `${circuit}_contract`;

describe(circuit, async function () {
    // DO NOT await here - mocha does not work nicely with async/await in describe
    // So we're creating a single await'able here, and await in all tests.
    // Only the first one will actually be awaited, everything else will resolve immediately
    const setupPromise = prepareTest(circuit, fixture);
    
    
    describe("valid input", async function () {
        const tests = [
            {label: "1 * 2 = 2", input: new CircuitInputClass(1, 2, 2)},
            {label: "15 * 7 = 105", input: new CircuitInputClass(15, 7, 105)},
        ];

        for (const test of tests) {
            const {label, input} = test;
            it(label, async function() {
                const compilationArtifacts = await setupPromise;
                await runTest(contractName, compilationArtifacts.compiledCicuit, input, {returnValue: true});
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
                const compilationArtifacts = await setupPromise;
                await runTest(contractName, compilationArtifacts.compiledCicuit, input, {reverts: true});
            });
        }
    });
});