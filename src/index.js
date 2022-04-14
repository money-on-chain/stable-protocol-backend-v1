const { readJsonFile, getWeb3 } = require('./utils');
const { contractStatus, userBalance, readContracts, mintDoc } = require('./core');


require('dotenv').config();


const main  = async () => {

    const configPath = `./config.json`;
    
    const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT];
            
    const web3 = getWeb3(process.env.HOST_URI);

    // Obtain all contracts from one address of the MoC.sol
    dContracts = await readContracts(web3, config);        
   
    // Read info from different contract MoCState.sol MoCInrate.sol MoCSettlement.sol MoC.sol
    // in one call throught Multicall
    const dataContractStatus = await contractStatus(web3, dContracts);

    console.log(dataContractStatus);

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    
    // Get user balance
    const userBalanceStats = await userBalance(web3, dContracts, userAddress);

    console.log(userBalanceStats);

    const receipt = await mintDoc(web3, dContracts, 0.00001);
    
}


main();