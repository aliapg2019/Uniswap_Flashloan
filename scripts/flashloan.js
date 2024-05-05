const { ethers } = require('hardhat');
// const helper = require('@nomicfoundation/hardhat-network-helpers')
const { abi } = require('../artifacts/contracts/Flashloan.sol/Flashloan.json')
const { impersonateFundErc20 } = require("../utils/utilities");
const dataF = require('../arb_data/data.json');
// const dataF = require("../dataPools.json")
const fileInfo = require("../arb_data/traingularArb.json");
// const fileInfo = require('../traingularArb.json')
const ADDRESS = "0x245e77E56b1514D77910c9303e4b44dDb44B788c";
async function main(fees , tokens) {
  const WALE_WETH = 
  // "0x272817e6C8E7dBF3CB5d382FbFa0f53db4427d6A";
  "0x2291F52bddc937b5B840d15E551e1DA8C80c2B3c";
  const WALE_USDC = "0x99Dcb7939231f4Ad9aB89f6330a3176bE981dD29";
  const WETH_ADDRESS = 
  // "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC_ADDRESS = 
  // "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const LINK_ADDRESS = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
  const POOL_FEE = 3000; // 0.30% tier
  // Need this to convert ETH into WETH (Wrapped Ether) to cover the fees
  let weth, Flashloan , flashloan , deposit , approve , flash , getERC20 , usdc;
  while (weth == undefined || usdc == undefined) {
    try {
      weth = await ethers.getContractAt("IWETH", WETH_ADDRESS);
      usdc = await ethers.getContractAt("IERC20",USDC_ADDRESS);
    } catch (error) {
      console.log("WETH contract ERROR:",error);
    }
  }
  
  // Deploy Flashloan contract
  while (Flashloan == undefined || flashloan == undefined) {
    try {
       Flashloan = await ethers.getContractFactory("Flashloan");
       flashloan = await Flashloan.deploy(
          USDC_ADDRESS,
          WETH_ADDRESS,
          POOL_FEE
        );

        (await flashloan.getPairs(tokens, fees)).wait(1);
    
    } catch (error) {
      console.log("flashloans deploy ERROR:",error);
    }
  }

  while (getERC20 == undefined) {
    try {
       await impersonateFundErc20(
        weth,
        WALE_WETH,
        flashloan.target,
        "2"
      );
      getERC20 =1;  
    } catch (error) {
      console.log(error);
    }
  }
    console.log("ADDRESS:",flashloan.target);
    // Get some WETH to cover fee and approve Flashloan contract to use it.
    // Fee: 1 ETH * 0.3% = 0.003 ETH
    // while (deposit == undefined || approve == undefined) {
    //   try {
    //     deposit = await weth.deposit({ value: ethers.parseEther("0.003") });
    //     approve = await weth.approve(flashloan.target, ethers.parseEther("0.003"));
        
    //   } catch (error) {
    //     console.log("deposit and approve ERROR:",error);
    //   }
    // }
    
    console.log("ok");

  // Execute flashloan to borrow 1 ETH.
  // while (flash == undefined) {
  //   try {
      
  //     flash = 
  //     // await flashloan.arbitage([WETH_ADDRESS , USDC_ADDRESS , LINK_ADDRESS] , [500 , 3000 , 3000] , ethers.parseEther("1"));
  //   } catch (error) {
    //     console.log("flash ERROR:",error);
    //     flash = undefined;
    
    //   }
    // }
    console.log( typeof(ethers.parseEther("1")));
      flash =  await flashloan.flash("0",ethers.parseEther("1"));
      await flash.wait(6);
      
}




// use data file
function getFile(fPath) {
  try {
    const data = fs.readFileSync(fPath, "utf8");
    return data;
  } catch (err) {
    console.log("ok");
    return [];
  }
}

async function earnData (){
  let arbPools = [];
  let pools = dataF.data.pools;
  let needData = [],tokens;
  for (let i = 0; i < fileInfo.length; i++) {
      if (fileInfo[i].swap1 == "WETH") {
        let poolAddress1 = fileInfo[i].poolContract1;
        let poolAddress2 = fileInfo[i].poolContract2;
        let poolAddress3 = fileInfo[i].poolContract3;
        tokens = [
          fileInfo[i].swap1,
          fileInfo[i].swap2,
          fileInfo[i].swap3
        ]
        arbPools.push({poolAddress1 , poolAddress2 , poolAddress3 , tokens});
        
      }
  }
   let p1,p2,p3 , t1,t2,t3;
  for (let i = 0; i < arbPools.length; i++) {

    for (let j = 0; j < pools.length; j++) {
      if (arbPools[i].poolAddress1 == pools[j].id) {
        p1 = pools[j];
        if (arbPools[i].tokens[0] == pools[j].token0.symbol) {
          t1 =pools[j].token0.id
        }
        else{
          t1 = pools[j].token1.id
        }
        
        
      } 
      if (arbPools[i].poolAddress2 == pools[j].id) {
        p2 = pools[j];
        if (arbPools[i].tokens[1] == pools[j].token0.symbol) {
          t2 =pools[j].token0.id
        }
        else{
          t2 = pools[j].token1.id
        }
        
      } 
      if (arbPools[i].poolAddress3 == pools[j].id) {
        p3 = pools[j]; 
        if (arbPools[i].tokens[2] == pools[j].token0.symbol) {
          t3 =pools[j].token0.id
        }
        else{
          t3 = pools[j].token1.id
        }
      }

      if (p1 && p2 && p3 && t1 && t2 && t3) {

        needData.push({arb: {p1 , p2 , p3} , token:{t1 , t2 , t3}});
        p1 = p2 = p3 = undefined;
        t1 = t2 = t3 =undefined;
      }
      
    }
  }
  
  console.log(needData);
  for (let i = 0; i < needData.length; i++) {
    let feesArry=[
      needData[i].arb.p1.feeTier ,
      needData[i].arb.p2.feeTier,
      needData[i].arb.p2.feeTier
    ];
    let tokensArry = [
      needData[i].token.t1,
      needData[i].token.t2,
      needData[i].token.t3
    ];
      
    await main(feesArry , tokensArry)
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
        
      });
    
    
      console.log("i =>", i);
  }
}
earnData();
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// let flg = 0;
// do {
  
//   try {
    
//   } catch (error) {
//     console.log(error);
//   }
// } while (flg);


// for (let index = 0; index < 5; index++) {
  
  // main()
  // .catch((error) => {
  //   console.error(error);
  //   process.exitCode = 1;
    
  // });

  
  
// }