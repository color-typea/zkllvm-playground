import * as fs from 'fs';
import * as losslessJSON from 'lossless-json';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, Libraries} from 'hardhat-deploy/types';

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
    const gate = await depl('gates_gate_argument_split_gen', losslessJSON.parse(fs.readFileSync("./contracts/gates/linked_libs_list.json", 'utf8')));
    const verifier = await depl('PlaceholderVerifier', ["ProofVerifier"]);

    await depl('VerificationContract', ['CircuitParams'], [verifier.address, gate.address]);
};
func.tags = ['VerificationContract'];

export default func;

