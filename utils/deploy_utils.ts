
import * as fs from 'fs';
import * as losslessJSON from 'lossless-json';

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeploymentsExtension, Libraries } from 'hardhat-deploy/types';
import { Contract } from "ethers";

import { getLogger, LogLevels } from "./logging";

const LOGGER = getLogger(LogLevels.DEPLOY);

function readGateLibs(libsFile: string): Array<string> {
    if( fs.existsSync(libsFile)) {
        return losslessJSON.parse(fs.readFileSync(libsFile, 'utf8'));
    }
    else {
        return [];
    }
}

export type FixtureOutput = {
    contract: Contract
}

export class DeployFactory {
    constructor(private deployments: DeploymentsExtension, private deployer: string) {
    }

    async deployFromLibsJson(contract: string, libs_json: string, args: any[] = []) {
        return await this.deploy(contract, readGateLibs(libs_json), args);
    }

    async deploy(contract: string, dependecies: Array<string>, args: any[] = []) {
        let deployedLibs: Libraries = {}
        for (let lib of dependecies){
            await this.deployments.deploy(lib, {
                from: this.deployer,
                log: true,
            });
            deployedLibs[lib] = (await this.deployments.get(lib)).address;
        }
        await this.deployments.deploy(contract, {
            args: args,
            from: this.deployer,
            libraries : deployedLibs,
            log : true,
            gasLimit: 50000000000
        });
    
        const contractAddress = await this.deployments.get(contract);
        LOGGER.info(`Deployed ${contract} at ${contractAddress.address}`);
        return contractAddress;
    }
}

export class ContractGroupDeployer {
    constructor(private hre: HardhatRuntimeEnvironment, private circuitName: string, private path: string) {}

    async deploy(factory: DeployFactory): Promise<FixtureOutput> {
        LOGGER.info(`Deploying ${this.circuitName} at ${this.path}`);
        const circuit = this.circuitName;
        const commitment = await factory.deploy(`modular_commitment_scheme_${circuit}`, []);
        // const permutation_argument = await depl(`modular_permutation_argument_${circuit}`, []);
        const lookup = await factory.deployFromLibsJson(`modular_lookup_argument_${circuit}`, `${this.path}/gates/lookup_libs_list.json`);
        const gate = await factory.deployFromLibsJson(`modular_gate_argument_${circuit}`, `${this.path}/gates/gate_libs_list.json`);
        
        const modularVerifier = await factory.deploy(`modular_verifier_${circuit}`, []);

        const modularVerifierContract = await this.hre.ethers.getContract<Contract>(`modular_verifier_${circuit}`);
        await modularVerifierContract.initialize(
            //                permutation_argument.address,
            lookup.address,
            gate.address,
            commitment.address,
        );

        await factory.deploy(`${circuit}_contract`, [], [modularVerifier.address]);
        const contract = await this.hre.ethers.getContract<Contract>(`${circuit}_contract`);
        return {
            contract
        }
    }
}

export async function runDeploy(hre: HardhatRuntimeEnvironment, name: string, path: string): Promise<FixtureOutput> {
    const {getNamedAccounts} = hre;
    const {deployer} = await getNamedAccounts();
    LOGGER.info(`--- Starting deploying ${name} contract group as ${deployer} ---`);

    const factory = new DeployFactory(hre.deployments, deployer);
    const groupDeployer = new ContractGroupDeployer(hre, name, path);
    const result = await groupDeployer.deploy(factory);
    LOGGER.info(`--- Finished deploying ${name} contract group ---`);
    return result;
}