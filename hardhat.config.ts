import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@nomicfoundation/hardhat-ethers';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    hardhat: {
        blockGasLimit: 50000000000
    },
  },
  mocha: {
    timeout: 120000,
  //   parallel: true,
  },
};

export default config;
