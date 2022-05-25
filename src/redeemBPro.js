const { readJsonFile, getWeb3 } = require('./utils');
const { readContracts, redeemBPro } = require('./core');


require('dotenv').config();


const main  = async () => {

    const configPath = `./config.json`;
    
    const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT];
            
    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI);

    // Obtain all contracts from one address of the MoC.sol
    dContracts = await readContracts(web3, config);

    // Get amount from environment
    const amountBPro = `${process.env.OPERATION_AMOUNT_REDEEM_BPRO}`;
       
    // Send transaction and get receipt
    const receipt = await redeemBPro(web3, dContracts, amountBPro);
    
}


main();