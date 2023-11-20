import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { runDeploy } from "../utils/deploy_utils";

const CIRCUIT = "addition";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    await runDeploy(hre, CIRCUIT, `./contracts/c01_${CIRCUIT}`);
};
func.tags = [`${CIRCUIT}_fixture`];
export default func;