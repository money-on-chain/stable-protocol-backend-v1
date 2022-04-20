const { readJsonFile, getWeb3 } = require('./utils');
const { contractStatus, userBalance, readContracts, mintDoc, renderUserBalance, renderContractStatus } = require('./core');


require('dotenv').config();


const main  = async () => {

    const configPath = `./config.json`;
    
    const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT];
            
    const web3 = getWeb3(process.env.HOST_URI);

    // Obtain all contracts from one address of the MoC.sol
    dContracts = await readContracts(web3, config);        
       
    const receipt = await mintDoc(web3, dContracts, 10.0);
    
}


main();