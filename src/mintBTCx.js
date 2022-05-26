const { readJsonFile, getWeb3 } = require('./utils');
const { readContracts, mintBTCx } = require('./core');


require('dotenv').config();


const main  = async () => {

    const configPath = `./config.json`;
    
    const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT];
            
    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI);

    // Obtain all contracts from one address of the MoC.sol
    dContracts = await readContracts(web3, config);

    // Get amount from environment
    const amountBTCx = `${process.env.OPERATION_AMOUNT_MINT_BTCX}`;
       
    // Send transaction and get receipt
    const receipt = await mintBTCx(web3, dContracts, amountBTCx);
    
}


main();