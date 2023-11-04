import {expect} from "chai";
import * as hre from 'hardhat';
import { ProofGeneratorCLIProofProducer } from './proof_gen';
import { CircuitInput, CircuitInputClass } from './circuit_input';
import { Contract } from "ethers";
import "@nomicfoundation/hardhat-toolbox/network-helpers";

async function submitProof(contract: Contract, input: CircuitInput, zkProof: Buffer): Promise<boolean> {
    const report = { sum: input.expectedSum }; // Replace with your data
    const proof = {
        public_input: input.serializePublicForContract(),
        zkProof: zkProof,
    };
    return await contract.submitReportData(report, proof);
}

async function runTest(circuit_input: CircuitInput, shouldPass: boolean) {
    const proofProducer = new ProofGeneratorCLIProofProducer();
    const skipVerification = !shouldPass;
    try {
        await hre.deployments.fixture(['VerificationContract']);
        const Contract = await hre.ethers.getContract<Contract>('VerificationContract');
        const zkProof = await proofProducer.generateProof(circuit_input, skipVerification);
        const response = await submitProof(Contract, circuit_input, zkProof);
        expect(response).to.equal(shouldPass);
    } finally {
        // proofProducer.cleanup();
    }
}

describe("Contract", async function () {
    describe("valid input", async function () {
        // const tests = [
        //     {label: "1 + 2 = 3", input: new CircuitInputClass(1, 2, 3)},
        //     {label: "100 + 351 = 451", input: new CircuitInputClass(100, 351, 451)},
        // ]

        // for (const test of tests) {
        //     const {label, input} = test;
        //     it(label, async function() {
        //         await runTest(input, true);
        //     });
        // }
        

        it("sum 1..1024 == 524800", async function() {
            const arr = Array.from(Array(1024), (e, i) => i+1);
            const expectedSum = arr.reduce((acc, val) => acc + val, 0);
            expect(expectedSum).to.equal(524800); // self-check
            const input = new CircuitInputClass(arr, expectedSum);
            await runTest(input, true);
        });
    });
    // describe("invalid input", async function () {
    //     const tests = [
    //         {label: "1 + 1 = 3", input: new CircuitInputClass(1, 1, 3)},
    //         {label: "2 + 5 = 12", input: new CircuitInputClass(2, 5, 13)},
    //     ]

    //     for (const test of tests) {
    //         const {label, input} = test;
    //         it(label, async function() {
    //             await runTest(input, false);
    //         });
    //     }
    // });
});