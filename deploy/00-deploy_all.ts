
import * as fs from 'fs';
import * as losslessJSON from 'lossless-json';

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, Libraries} from 'hardhat-deploy/types';
import { Contract } from "ethers";

function readGateLibs(libs: string): Array<string> {
    const gatesFile = `./contracts/gates/${libs}.json`;
    if( fs.existsSync(gatesFile)) {
        return losslessJSON.parse(fs.readFileSync(gatesFile, 'utf8'));
    }
    else {
        return [];
    }
}



const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {getNamedAccounts, deployments} = hre;
    const {deployer} = await getNamedAccounts();

    async function depl(contract: string, dependecies: Array<string>, args: any[] = []) {
        let deployedLibs: Libraries = {}
        for (let lib of dependecies){
            await deployments.deploy(lib, {
                from: deployer,
                log: true,
            });
            deployedLibs[lib] = (await deployments.get(lib)).address;
        }
        await deployments.deploy(contract, {
            args: args,
            from: deployer,
            libraries : deployedLibs,
            log : true,
            gasLimit: 50000000000
        });
    
        return await deployments.get(contract);
    }
    const circuit = "gates";
    const commitment = await depl(`modular_commitment_scheme_${circuit}`, []);
    // const permutation_argument = await depl(`modular_permutation_argument_${circuit}`, []);
    const lookup = await depl(`modular_lookup_argument_${circuit}`, readGateLibs("lookup_libs_list"));
    const gate = await depl(`modular_gate_argument_${circuit}`, readGateLibs("gate_libs_list"));
    
    const modularVerifier = await depl(`modular_verifier_${circuit}`, []);

    const modularVerifierContract = await hre.ethers.getContract<Contract>(`modular_verifier_${circuit}`);
    await modularVerifierContract.initialize(
        //                permutation_argument.address,
        lookup.address,
        gate.address,
        commitment.address,
    );

    await depl('VerificationContract', [], [modularVerifier.address]);
};
func.tags = ['VerificationContract'];

export default func;

