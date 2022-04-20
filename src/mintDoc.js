const { readJsonFile, getWeb3 } = require('./utils');
const { readContracts, mintDoc } = require('./core');


require('dotenv').config();


const main  = async () => {

    const configPath = `./config.json`;
    
    const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT];
            
    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI);

    // Obtain all contracts from one address of the MoC.sol
    dContracts = await readContracts(web3, config);

    // Get amount from environment
    const amountDoc = `${process.env.OPERATION_AMOUNT_MINT_DOC}`;
       
    // Send transaction and get receipt
    const receipt = await mintDoc(web3, dContracts, amountDoc);
    
}


main();