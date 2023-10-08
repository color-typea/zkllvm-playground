import {expect} from "chai";
import * as hre from 'hardhat';
import { CircuitInput, CircuitInputClass, ProofGeneratorCLIProofProducer } from './proof_gen';
import { Contract } from "ethers";
import "@nomicfoundation/hardhat-toolbox/network-helpers";

async function runProducer(circuit_input: CircuitInput): Promise<Buffer> {
    const proofProducer = new ProofGeneratorCLIProofProducer();
    return proofProducer.generateProof(circuit_input);
}

async function submitProof(contract: Contract, input: CircuitInput, zkProof: Buffer): Promise<boolean> {
    const report = { sum: input.sum }; // Replace with your data
    const proof = {
        public_input: input.serializePublicForContract(),
        zkProof: zkProof,
    };
    return await contract.submitReportData(report, proof);
}

async function runTest(circuit_input: CircuitInput, expectedResult: bool) {
    await hre.deployments.fixture(['VerificationContract']);
    const Contract = await hre.ethers.getContract<Contract>('VerificationContract');
    const zkProof = await runProducer(circuit_input);
    const response = await submitProof(Contract, circuit_input, zkProof);
    expect(response).to.equal(expectedResult);
}

describe("Contract", async function () {
    describe("valid input", async function () {
        const tests = [
            {label: "1 + 2 = 3", input: new CircuitInputClass(1, 2, 3)},
            {label: "100 + 351 = 451", input: new CircuitInputClass(100, 351, 451)},
        ]

        for (const test of tests) {
            const {label, input} = test;
            it(label, async function() {
                await runTest(input, true);
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
                await runTest(input, false);
            });
        }
    });
});