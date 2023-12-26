import * as hre from 'hardhat';
import { Uint, uint128 } from "solidity-math";
import {expect} from "chai";
import "@nomicfoundation/hardhat-toolbox/network-helpers";
import { createHash } from 'crypto';
import { TransactionResponse } from 'ethers';


import { IProofProducer, ProofGeneratorCLIProofProducer } from '../utils/proof_gen';
import { Contract } from "ethers";
import { getLogger, LogLevels } from "../utils/logging";
import { AllCircuits, CircuitNames, CompilationArtifacts } from "../utils/prepare_artifacts";
import { CircuitInput } from '../utils/circuit_input';

type TestOptions = { returnValue?: boolean, reverts?: boolean };

const LOGGER = getLogger(LogLevels.CONTRACT_INTERACTION);

export async function submitProof(contract: Contract, input: CircuitInput, zkProof: Buffer): Promise<TransactionResponse> {
    const proof = {
        public_input: input.serializePublicForContract(),
        zkProof: zkProof,
    };
    return await contract.submitReportData(proof, {gasLimit: 30_500_000});
}

export class TestRunner {
    fixture: string;
    contract: string;
    modularVerifier: string;

    private prepareAwaitable: Promise<CompilationArtifacts> | null = null;
    private _factory: (x: CompilationArtifacts) => IProofProducer;
    
    constructor(public circuitName: CircuitNames, private proofProducerFactory?: (x: CompilationArtifacts) => IProofProducer) {
        this.fixture = `${circuitName}_fixture`;
        this.contract = `${circuitName}_contract`;
        this.modularVerifier = `modular_verifier_${circuitName}`;
        this._factory = proofProducerFactory ?? this._defaultProducerFactory;
    }

    async prepareTest(): Promise<CompilationArtifacts> {
        if (this.prepareAwaitable == null) {
            this.prepareAwaitable = this._prepareAwaitable();
        }
        return this.prepareAwaitable;
    }

    async _prepareAwaitable(): Promise<CompilationArtifacts> {
        const circuitArtifactsFactory = AllCircuits.get(this.circuitName);
        if (circuitArtifactsFactory == null) {
            throw new Error(`Circuit artifacts factory for ${this.circuitName} is not found`);
        }
        const result = await circuitArtifactsFactory.prepareArtifacts();
        await hre.deployments.fixture([this.fixture]);
        return result;
    }

    private _defaultProducerFactory(artifacts: CompilationArtifacts): IProofProducer {
        return new ProofGeneratorCLIProofProducer(artifacts.compiledCircuit);
    }

    async runTest(
        circuit_input: CircuitInput, 
        { returnValue = false, reverts = false }: TestOptions
    ) {
        const artifacts = await this.prepareTest();
        const proofProducer = this._factory(artifacts);
        try {
            LOGGER.debug("Proover payload", JSON.stringify({private: circuit_input.serializePrivateForProofGen(), public: circuit_input.serializePublicForProofGen()}));
            LOGGER.debug("Verifier public input", JSON.stringify(circuit_input.serializePublicForContract()));
            const Contract = await hre.ethers.getContract<Contract>(this.contract);
            const ModularVerifier = await hre.ethers.getContract<Contract>(this.modularVerifier);
            
            const zkProof = await proofProducer.generateProof(circuit_input);
            LOGGER.info("Submitting proof");
            const tx = submitProof(Contract, circuit_input, zkProof);
            if (reverts) {
                await expect(tx).to.be.reverted;
            } else {
                await expect(tx).to.emit(ModularVerifier, 'VerificationResult').withArgs(returnValue);
            }
        } finally {
            proofProducer.cleanup();
        }
    }
}

export function uint256ToBuffer32(value: Uint, endianness: 'be' | 'le' = 'le'): Buffer {
    return value.bn.toBuffer(endianness, 32);
}

export function computeSHA256Hash(a: Uint, b: Uint): Buffer {
    const buffer = Buffer.concat([a.bn.toBuffer('le', 32), b.bn.toBuffer('le', 32)]);

    if (buffer.length != 64) { throw new Error(`Buffer should contain exactly 64 bytes, got ${buffer.length}`)};

    return createHash('sha256').update(buffer).digest();
}

export function packUint64IntoSha256(a: Uint, b: Uint, c: Uint, d: Uint): Buffer {
    return Buffer.concat([
        a.bn.toBuffer('le', 8),
        b.bn.toBuffer('le', 8),
        c.bn.toBuffer('le', 8),
        d.bn.toBuffer('le', 8),
    ]);
}