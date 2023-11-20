import "@nomicfoundation/hardhat-toolbox/network-helpers";
import {prepareTest, CircuitInput, InputBase, runTest} from "./test_utils";

export class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public a: number,
        public b: number,
        public sum: number,
    ) {
        super();
    }

    serializeFullForProofGen(): any[] {
        return [
            InputBase.asInt(this.a),
            InputBase.asInt(this.b),
            InputBase.asInt(this.sum),
        ];
    }

    serializePublicForContract(): any[] {
        return [
            this.a,
            this.b,
            this.sum,
        ];
    }

    getReport(): object {
        return { sum: this. sum };
    }
}



describe("Addition", async function () {
    const circuit = 'addition';
    const fixture = `${circuit}_fixture`;
    const contractName = `${circuit}_contract`;

    // DO NOT await here - mocha does not work nicely with async/await in describe
    // So we're creating a single await'able here, and await in all tests.
    // Only the first one will actually be awaited, everything else will resolve immediately
    const setupPromise = prepareTest(circuit, fixture);
    
    
    describe("valid input", async function () {
        const tests = [
            {label: "1 + 2 = 3", input: new CircuitInputClass(1, 2, 3)},
            {label: "100 + 351 = 451", input: new CircuitInputClass(100, 351, 451)},
        ]        

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
            {label: "1 + 1 = 3", input: new CircuitInputClass(1, 1, 3)},
            {label: "2 + 5 = 12", input: new CircuitInputClass(2, 5, 13)},
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