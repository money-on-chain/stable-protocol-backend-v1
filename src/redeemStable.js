const { readJsonFile, getWeb3 } = require('./utils');
const { readContracts, redeemStable, redeemStableRRC20, getAppMode } = require('./core');


require('dotenv').config();


const main  = async () => {

    const configPath = `./config.json`;
    
    const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT];
            
    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI);

    // Obtain all contracts from one address of the MoC.sol
    dContracts = await readContracts(web3, config);

    // Get amount from environment
    const amountStable = `${process.env.OPERATION_AMOUNT_REDEEM_STABLE}`;
    
    const appMode = getAppMode();
    if (appMode === "MoC") {     
        // Collateral Coinbase   
        const receipt = await redeemStable(web3, dContracts, config, amountStable);        
    } else {
        // Collateral RRC20
        const receipt = await redeemStableRRC20(web3, dContracts, config, amountStable);        
    }
    
}


main();