import "@nomicfoundation/hardhat-toolbox/network-helpers";
import { TestRunner} from "./test_utils";
import { BigNumberish } from "ethers";
import { Uint, uint64 } from "solidity-math";
import { expect } from 'chai';
import { CircuitInput, InputBase } from "../utils/circuit_input";
import { PrecomputedProofProducer, ProofGeneratorCLIProofProducer } from "../utils/proof_gen";

import * as path from 'path';
import { CompilationArtifacts } from "../utils/prepare_artifacts";

const CUR_DIR = __dirname;
const PROJECT_DIR = path.dirname(CUR_DIR);

class CircuitInputClass extends InputBase implements CircuitInput {
    constructor(
        public value: Uint,
        public shift: Uint,
        public expected_shifted: Uint,
    ) {
        super();
    }

    serializePrivateForProofGen(): any[] {
        return [
            // InputBase.asInt(this.value),
            // InputBase.asInt(this.shift),
            // InputBase.asInt(this.expected_shifted),
        ];
    }

    serializePublicForProofGen(): any[] {
        return [
            InputBase.asInt(this.value),
            InputBase.asInt(this.shift),
            InputBase.asInt(this.expected_shifted),
        ];
    }

    serializePublicForContract(): BigNumberish[] {
        return [
            this.value.bn.toString(),
            this.shift.bn.toString(),
            this.expected_shifted.bn.toString(),
        ];
    }
}

const pregeneratedProofProducer = (_: CompilationArtifacts) =>  new PrecomputedProofProducer(path.join(PROJECT_DIR, 'output/proof.bin'));
const normalProducer = (artifacts: CompilationArtifacts) => new ProofGeneratorCLIProofProducer(artifacts.compiledCircuit)

// Note: runner performs setup initialization and ensures compilation/assignment/etc. is run exactly once for all tests
const runner = new TestRunner('playground', normalProducer);

describe(runner.circuitName, async function () {       
    describe("valid input", async function () {
        it("runs successfully", async () => {
            const [value, shift, expected ] = [1, 2, 4];
            expect(uint64(value).shln(shift).toString()).to.equal(uint64(expected).toString());
            const input = new CircuitInputClass(uint64(value), uint64(shift), uint64(expected));
            await runner.runTest(input, {returnValue: true});
       });
    });
});