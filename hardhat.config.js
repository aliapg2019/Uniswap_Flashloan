require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks:{
    hardhat:{
      forking:{
        enabled: true,
        url: process.env.INFURA_NODE,
      },
      // timeout:100000,
      chainId: 1,
    },
  },
};
