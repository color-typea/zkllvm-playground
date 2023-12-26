import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { runDeploy } from "../utils/deploy_utils";

const CIRCUIT = "endianness";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    await runDeploy(hre, CIRCUIT, `./contracts/c04_${CIRCUIT}`);
};
func.tags = [`${CIRCUIT}_fixture`];
export default func;