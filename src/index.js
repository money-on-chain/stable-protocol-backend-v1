const { readJsonFile, getWeb3 } = require('./utils');
const { contractStatus, userBalance, readContracts } = require('./core');


require('dotenv').config();


const main  = async () => {

    const configPath = `./config.json`;
    
    const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT];
            
    const web3 = getWeb3(process.env.HOST_URI);

    // Obtain all contracts from one address of the MoC.sol
    dContracts = await readContracts(web3, config);
        
   
    // Read info from different contract MoCState.sol MoCInrate.sol MoCSettlement.sol MoC.sol
    // in one call throught Multicall
    const dataContractStatus = await contractStatus(
        web3, 
        dContracts["contracts"]["multicall"], 
        dContracts["contracts"]["moc"], 
        dContracts["contracts"]["mocstate"], 
        dContracts["contracts"]["mocinrate"],
        dContracts["contracts"]["mocsettlement"] );

    console.log(dataContractStatus);

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    
    // Get user balance
    const userBalanceStats = await userBalance(
        web3, 
        dContracts["contracts"]["multicall"], 
        dContracts["contracts"]["moc"], 
        dContracts["contracts"]["mocinrate"], 
        dContracts["contracts"]["moctoken"], 
        dContracts["contracts"]["bprotoken"], 
        dContracts["contracts"]["doctoken"], 
        userAddress);

    console.log(userBalanceStats);
    
}


main();