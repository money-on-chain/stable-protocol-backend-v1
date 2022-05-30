const { readJsonFile, getWeb3 } = require('./utils');
const { readContracts, mintRiskpro, mintRiskproRRC20, getAppMode } = require('./core');


require('dotenv').config();


const main  = async () => {

    const configPath = `./config.json`;
    
    const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT];
            
    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI);

    // Obtain all contracts from one address of the MoC.sol
    dContracts = await readContracts(web3, config);

    // Get amount from environment
    const amountRiskpro = `${process.env.OPERATION_AMOUNT_MINT_RISKPRO}`;    

    const appMode = getAppMode();
    if (appMode === "MoC") {     
        // Collateral Coinbase   
        const receipt = await mintRiskpro(web3, dContracts, config, amountRiskpro);
    } else {
        // Collateral RRC20
        const receipt = await mintRiskproRRC20(web3, dContracts, config, amountRiskpro);
        
    }
    
}


main();