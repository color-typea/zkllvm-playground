import { expect } from "chai";
import * as path from 'path'
import * as hre from 'hardhat';
import { ProofGeneratorCLIProofProducer } from './proof_gen';
import { CircuitInput, CircuitInputClass } from './circuit_input';
import { Contract } from "ethers";
import "@nomicfoundation/hardhat-toolbox/network-helpers";

async function runProducer(circuit_input: CircuitInput): Promise<Buffer> {
    const proofProducer = new ProofGeneratorCLIProofProducer();
    return proofProducer.generateProof(circuit_input);
}

async function submitProof(contract: Contract, input: CircuitInput, zkProof: Buffer): Promise<boolean> {
    const report = { sum: input.expected_total_balance }; // Replace with your data
    const proof = {
        public_input: input.serializePublicForContract(),
        zkProof: zkProof,
    };
    return await contract.submitReportData(report, proof);
}

async function runTest(circuit_input: CircuitInput, expectedResult: boolean) {
    await hre.deployments.fixture(['VerificationContract']);
    const Contract = await hre.ethers.getContract<Contract>('VerificationContract');
    const zkProof = await runProducer(circuit_input);
    const response = await submitProof(Contract, circuit_input, zkProof);
    expect(response).to.equal(expectedResult);
}

function padTo(arr: number[], length: number, padValue: number = 0): number[] {
    if (arr.length >= length) {
        return arr.slice(0, length);
    } else {
        const padding = Array(length - arr.length).fill(padValue);
        return arr.concat(padding);
    }
}

function sum(arr: number[]): number {
    let val = 0;
    for (let i = 0; i < arr.length; i++) {
        val += arr[i];
    }
    return val;
}

describe("Contract", async function () {
    this.timeout(120000); 
    const inputSize = 8;
    describe("valid input", async function () {
        describe("works for correct sum and hash", async () => {
            it("[1,2,3,4]", async () => {
                const array = [1, 2, 3, 4];
                const input = new CircuitInputClass(
                    4,
                    padTo(array, inputSize),
                    sum(array),
                    Buffer.from('256da5067655c109f9c2a30d4768fec4e4866a9471a5d6eebc703a5dc0870352', 'hex'));
                await runTest(input, true);
            });
            it("balancesTreeExample8", async () => {
                const array = [
                    1, 2, 3, 4, 5, 6, 7, 8,
                ];
                const input = new CircuitInputClass(
                    16,
                    padTo(array, inputSize),
                    sum(array),
                    Buffer.from('4168f84a0de6317a08fe5dbebe5536746b0acec3b1f14aa7b67e7e63a3cfff0f', 'hex'));
                await runTest(input, true);
            })
        });
    });
    describe("invalid input", async function () {
        it("sum doesn't match", async function () {
            const array = [1, 2, 3, 4];
            const input = new CircuitInputClass(
                4,
                padTo(array, inputSize),
                sum(array) + 10,
                Buffer.from('256da5067655c109f9c2a30d4768fec4e4866a9471a5d6eebc703a5dc0870352', 'hex'));
            await runTest(input, false);
        });
        it("hash doesn't match", async function () {
            const array = [1, 2, 3, 4];
            const input = new CircuitInputClass(
                4,
                padTo(array, inputSize),
                sum(array) + 10,
                Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'));
            await runTest(input, false);
        });
    });
});