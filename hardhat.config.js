require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks:{
    hardhat:{
      forking:{
        enabled: true,
        url: 'https://mainnet.infura.io/v3/7daf85c40c5d4f6187c849747ad0076b',
      },
      // timeout:100000,
      chainId: 1,
    },
  },
};
