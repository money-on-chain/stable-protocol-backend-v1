const BN = require("bn.js");
const abiDecoder = require('abi-decoder');
const Web3 = require('web3');

const { readJsonFile } = require('./utils');


require('dotenv').config();

const BUCKET_X2 = '0x5832000000000000000000000000000000000000000000000000000000000000';
const BUCKET_C0 = '0x4330000000000000000000000000000000000000000000000000000000000000';

const connectorAddresses  = async (web3, dContracts) => { 
        
    const multicall = dContracts["contracts"]["multicall"]; 
    const mocconnector = dContracts["contracts"]["mocconnector"];    

    const listMethods = [
        [mocconnector.options.address, mocconnector.methods.mocState().encodeABI()],
        [mocconnector.options.address, mocconnector.methods.mocInrate().encodeABI()],
        [mocconnector.options.address, mocconnector.methods.mocExchange().encodeABI()],
        [mocconnector.options.address, mocconnector.methods.mocSettlement().encodeABI()],
        [mocconnector.options.address, mocconnector.methods.docToken().encodeABI()],
        [mocconnector.options.address, mocconnector.methods.bproToken().encodeABI()]
    ]

    const multicallResult = await multicall.methods.tryBlockAndAggregate(false, listMethods).call();
    
    const listReturnData = multicallResult[2].map(x => web3.eth.abi.decodeParameter('address', x.returnData));
    
    return listReturnData

}

const readContracts  = async (web3, config) => { 

    dContracts = {};
    dContracts["json"] = {};
    dContracts["contracts"] = {};
    dContracts["contractsAddresses"] = {};

    const Multicall2 = readJsonFile(`./abis/${process.env.MOC_PROJECT}/Multicall2.json`);
    dContracts["json"]["Multicall2"] = Multicall2;
    const MoCConnector = readJsonFile(`./abis/${process.env.MOC_PROJECT}/MoCConnector.json`);   
    dContracts["json"]["MoCConnector"] = MoCConnector;
    const MoC = readJsonFile(`./abis/${process.env.MOC_PROJECT}/MoC.json`);
    dContracts["json"]["MoC"] = MoC;
    const MoCState = readJsonFile(`./abis/${process.env.MOC_PROJECT}/MoCState.json`);
    dContracts["json"]["MoCState"] = MoCState;
    const MoCExchange = readJsonFile(`./abis/${process.env.MOC_PROJECT}/MoCExchange.json`);
    dContracts["json"]["MoCExchange"] = MoCExchange;
    const MoCInrate = readJsonFile(`./abis/${process.env.MOC_PROJECT}/MoCInrate.json`);
    dContracts["json"]["MoCInrate"] = MoCInrate;
    const MoCSettlement = readJsonFile(`./abis/${process.env.MOC_PROJECT}/MoCSettlement.json`);
    dContracts["json"]["MoCSettlement"] = MoCSettlement;
    const DocToken = readJsonFile(`./abis/${process.env.MOC_PROJECT}/DocToken.json`);
    dContracts["json"]["DocToken"] = DocToken;
    const BProToken = readJsonFile(`./abis/${process.env.MOC_PROJECT}/BProToken.json`);
    dContracts["json"]["BProToken"] = BProToken;
    const MoCToken = readJsonFile(`./abis/${process.env.MOC_PROJECT}/MoCToken.json`);
    dContracts["json"]["MoCToken"] = MoCToken;
    
    console.log('Reading Multicall2 Contract... address: ', config.Multicall2);
    const multicall = new web3.eth.Contract(Multicall2.abi, config.Multicall2);
    dContracts["contracts"]["multicall"] = multicall;

    console.log('Reading MoC Contract... address: ', config.MoC);
    const moc = new web3.eth.Contract(MoC.abi, config.MoC);
    dContracts["contracts"]["moc"] = moc;

    const connectorAddress = await moc.methods.connector().call();

    console.log('Reading MoCConnector... address: ', connectorAddress);    
    const mocconnector = new web3.eth.Contract(MoCConnector.abi, connectorAddress);
    dContracts["contracts"]["mocconnector"] = mocconnector;

    // Read contracts addresses from connector
    const [
      mocStateAddress,
      mocInrateAddress,
      mocExchangeAddress,
      mocSettlementAddress,
      docTokenAddress,
      bproTokenAddress
    ] = await connectorAddresses(web3, dContracts);
    
    console.log('Reading MoC State Contract... address: ', mocStateAddress);
    const mocstate = new web3.eth.Contract(MoCState.abi, mocStateAddress);
    dContracts["contracts"]["mocstate"] = mocstate;

    console.log('Reading MoC Inrate Contract... address: ', mocInrateAddress);
    const mocinrate = new web3.eth.Contract(MoCInrate.abi, mocInrateAddress);
    dContracts["contracts"]["mocinrate"] = mocinrate;

    console.log('Reading MoC Exchange Contract... address: ', mocExchangeAddress);
    const mocexchange = new web3.eth.Contract(MoCExchange.abi, mocExchangeAddress);
    dContracts["contracts"]["mocexchange"] = mocexchange;

    console.log('Reading MoC Settlement  Contract... address: ', mocSettlementAddress);
    const mocsettlement = new web3.eth.Contract(MoCSettlement.abi, mocSettlementAddress);
    dContracts["contracts"]["mocsettlement"] = mocsettlement;

    console.log('Reading DoC Token Contract... address: ', docTokenAddress);
    const doctoken = new web3.eth.Contract(DocToken.abi, docTokenAddress);
    dContracts["contracts"]["doctoken"] = doctoken;

    console.log('Reading BPro Token Contract... address: ', bproTokenAddress);
    const bprotoken = new web3.eth.Contract(BProToken.abi, bproTokenAddress);
    dContracts["contracts"]["bprotoken"] = bprotoken;

    const mocTokenAddress = await mocstate.methods.getMoCToken().call();

    console.log('Reading MoC Token Contract... address: ', mocTokenAddress);
    const moctoken = new web3.eth.Contract(MoCToken.abi, mocTokenAddress);
    dContracts["contracts"]["moctoken"] = moctoken;

    // Abi decoder
    abiDecoder.addABI(dContracts["json"]["MoC"].abi);
    abiDecoder.addABI(dContracts["json"]["MoCState"].abi);
    abiDecoder.addABI(dContracts["json"]["MoCExchange"].abi);
    abiDecoder.addABI(dContracts["json"]["MoCInrate"].abi);
    abiDecoder.addABI(dContracts["json"]["MoCSettlement"].abi);
    abiDecoder.addABI(dContracts["json"]["DocToken"].abi);
    abiDecoder.addABI(dContracts["json"]["BProToken"].abi);
    abiDecoder.addABI(dContracts["json"]["MoCToken"].abi);

    return dContracts

}


const contractStatus  = async (web3, dContracts) => { 

    const multicall = dContracts["contracts"]["multicall"];
    const moc = dContracts["contracts"]["moc"];
    const mocstate = dContracts["contracts"]["mocstate"];
    const mocinrate = dContracts["contracts"]["mocinrate"];
    const mocsettlement = dContracts["contracts"]["mocsettlement"];

    console.log("Reading contract status ...");
    
    const listMethods = [
        [mocstate.options.address, mocstate.methods.getBitcoinPrice().encodeABI(), 'uint256'], // 0
        [mocstate.options.address, mocstate.methods.getMoCPrice().encodeABI(), 'uint256'], // 1
        [mocstate.options.address, mocstate.methods.absoluteMaxBPro().encodeABI(), 'uint256'], // 2
        [mocstate.options.address, mocstate.methods.maxBProx(BUCKET_X2).encodeABI(), 'uint256'], // 3
        [mocstate.options.address, mocstate.methods.absoluteMaxDoc().encodeABI(), 'uint256'], // 4
        [mocstate.options.address, mocstate.methods.freeDoc().encodeABI(), 'uint256'], // 5
        [mocstate.options.address, mocstate.methods.leverage(BUCKET_C0).encodeABI(), 'uint256'], // 6
        [mocstate.options.address, mocstate.methods.cobj().encodeABI(), 'uint256'], // 7
        [mocstate.options.address, mocstate.methods.leverage(BUCKET_X2).encodeABI(), 'uint256'], // 8
        [mocstate.options.address, mocstate.methods.rbtcInSystem().encodeABI(), 'uint256'], //9
        [mocstate.options.address, mocstate.methods.getBitcoinMovingAverage().encodeABI(), 'uint256'], //10
        [mocstate.options.address, mocstate.methods.getInrateBag(BUCKET_C0).encodeABI(), 'uint256'], //11
        [mocstate.options.address, mocstate.methods.getBucketNBTC(BUCKET_C0).encodeABI(), 'uint256'], //12
        [mocstate.options.address, mocstate.methods.getBucketNDoc(BUCKET_C0).encodeABI(), 'uint256'], //13
        [mocstate.options.address, mocstate.methods.getBucketNBPro(BUCKET_C0).encodeABI(), 'uint256'], //14
        [mocstate.options.address, mocstate.methods.getBucketNBTC(BUCKET_X2).encodeABI(), 'uint256'], //15
        [mocstate.options.address, mocstate.methods.getBucketNDoc(BUCKET_X2).encodeABI(), 'uint256'], //16
        [mocstate.options.address, mocstate.methods.getBucketNBPro(BUCKET_X2).encodeABI(), 'uint256'], //17
        [mocstate.options.address, mocstate.methods.globalCoverage().encodeABI(), 'uint256'],  //18
        [moc.options.address, moc.methods.getReservePrecision().encodeABI(), 'uint256'], // 19
        [moc.options.address, moc.methods.getMocPrecision().encodeABI(), 'uint256'], //20
        [mocstate.options.address, mocstate.methods.coverage(BUCKET_X2).encodeABI(), 'uint256'], //21
        [mocstate.options.address, mocstate.methods.bproTecPrice().encodeABI(), 'uint256'], //22
        [mocstate.options.address, mocstate.methods.bproUsdPrice().encodeABI(), 'uint256'],  //23
        [mocstate.options.address, mocstate.methods.bproSpotDiscountRate().encodeABI(), 'uint256'], //24
        [mocstate.options.address, mocstate.methods.maxBProWithDiscount().encodeABI(), 'uint256'],  //25
        [mocstate.options.address, mocstate.methods.bproDiscountPrice().encodeABI(), 'uint256'], //26
        [mocstate.options.address, mocstate.methods.bucketBProTecPrice(BUCKET_X2).encodeABI(), 'uint256'], //27
        [mocstate.options.address, mocstate.methods.bproxBProPrice(BUCKET_X2).encodeABI(), 'uint256'],  //28
        [mocinrate.options.address, mocinrate.methods.spotInrate().encodeABI(), 'uint256'], //29
        [mocinrate.options.address, mocinrate.methods.MINT_BPRO_FEES_RBTC().encodeABI(), 'uint256'], //30
        [mocinrate.options.address, mocinrate.methods.REDEEM_BPRO_FEES_RBTC().encodeABI(), 'uint256'], //31
        [mocinrate.options.address, mocinrate.methods.MINT_DOC_FEES_RBTC().encodeABI(), 'uint256'], //32
        [mocinrate.options.address, mocinrate.methods.REDEEM_DOC_FEES_RBTC().encodeABI(), 'uint256'], //33
        [mocinrate.options.address, mocinrate.methods.MINT_BTCX_FEES_RBTC().encodeABI(), 'uint256'], //34
        [mocinrate.options.address, mocinrate.methods.REDEEM_BTCX_FEES_RBTC().encodeABI(), 'uint256'], //35
        [mocinrate.options.address, mocinrate.methods.MINT_BPRO_FEES_MOC().encodeABI(), 'uint256'], //36
        [mocinrate.options.address, mocinrate.methods.REDEEM_BPRO_FEES_MOC().encodeABI(), 'uint256'], //37
        [mocinrate.options.address, mocinrate.methods.MINT_DOC_FEES_MOC().encodeABI(), 'uint256'], //38
        [mocinrate.options.address, mocinrate.methods.REDEEM_DOC_FEES_MOC().encodeABI(), 'uint256'], //39
        [mocinrate.options.address, mocinrate.methods.MINT_BTCX_FEES_MOC().encodeABI(), 'uint256'], //40
        [mocinrate.options.address, mocinrate.methods.REDEEM_BTCX_FEES_MOC().encodeABI(), 'uint256'], //41
        [mocstate.options.address, mocstate.methods.dayBlockSpan().encodeABI(), 'uint256'], //42
        [mocsettlement.options.address, mocsettlement.methods.getBlockSpan().encodeABI(), 'uint256'], //43
        [mocstate.options.address, mocstate.methods.blocksToSettlement().encodeABI(), 'uint256'], //44
        [mocstate.options.address, mocstate.methods.state().encodeABI(), 'uint256'], //45
        [moc.options.address, moc.methods.paused().encodeABI(), 'bool'], //46
        [mocstate.options.address, mocstate.methods.getLiquidationEnabled().encodeABI(), 'bool'], //47
        [mocstate.options.address, mocstate.methods.getProtected().encodeABI(), 'uint256'], //48
        [mocstate.options.address, mocstate.methods.getMoCToken().encodeABI(), 'address'], //49
        [mocstate.options.address, mocstate.methods.getMoCPriceProvider().encodeABI(), 'address'], //50
        [mocstate.options.address, mocstate.methods.getBtcPriceProvider().encodeABI(), 'address'], //51
        [mocstate.options.address, mocstate.methods.getMoCVendors().encodeABI(), 'address'] //52
    ]
  
    // Remove decode result parameter
    const cleanListMethods = listMethods.map(x => [x[0], x[1]]);
  
    const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call();
      
    const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData));
    
    const d_moc_state = {};  
    d_moc_state["blockHeight"] = multicallResult[0];
    d_moc_state["bitcoinPrice"] = listReturnData[0];
    d_moc_state["mocPrice"] = listReturnData[1];
    d_moc_state["bproAvailableToRedeem"] = listReturnData[2];
    d_moc_state["bprox2AvailableToMint"] = listReturnData[3];
    d_moc_state["docAvailableToMint"] = listReturnData[4];
    d_moc_state["docAvailableToRedeem"] = listReturnData[5];
    d_moc_state["b0Leverage"] = listReturnData[6];
    d_moc_state["b0TargetCoverage"] = listReturnData[7];
    d_moc_state["x2Leverage"] = listReturnData[8];
    d_moc_state["totalBTCAmount"] = listReturnData[9];
    d_moc_state["bitcoinMovingAverage"] = listReturnData[10];
    d_moc_state["b0BTCInrateBag"] = listReturnData[11];
    d_moc_state["b0BTCAmount"] = listReturnData[12];
    d_moc_state["b0DocAmount"] = listReturnData[13];
    d_moc_state["b0BproAmount"] = listReturnData[14];
    d_moc_state["x2BTCAmount"] = listReturnData[15];
    d_moc_state["x2DocAmount"] = listReturnData[16];
    d_moc_state["x2BproAmount"] = listReturnData[17];
    d_moc_state["globalCoverage"] = listReturnData[18];
    d_moc_state["reservePrecision"] = listReturnData[19];
    d_moc_state["mocPrecision"] = listReturnData[20];
    d_moc_state["x2Coverage"] = listReturnData[21];
    d_moc_state["bproPriceInRbtc"] = listReturnData[22];
    d_moc_state["bproPriceInUsd"] = listReturnData[23];
    d_moc_state["bproDiscountRate"] = listReturnData[24];
    d_moc_state["maxBproWithDiscount"] = listReturnData[25];
    d_moc_state["bproDiscountPrice"] = listReturnData[26];
    d_moc_state["bprox2PriceInRbtc"] = listReturnData[27];
    d_moc_state["bprox2PriceInBpro"] = listReturnData[28];
    d_moc_state["spotInrate"] = listReturnData[29];
    
    const commission_rates_types = {};
    commission_rates_types["MINT_BPRO_FEES_RBTC"] = listReturnData[30];
    commission_rates_types["REDEEM_BPRO_FEES_RBTC"] = listReturnData[31];
    commission_rates_types["MINT_DOC_FEES_RBTC"] = listReturnData[32];
    commission_rates_types["REDEEM_DOC_FEES_RBTC"] = listReturnData[33];
    commission_rates_types["MINT_BTCX_FEES_RBTC"] = listReturnData[34];
    commission_rates_types["REDEEM_BTCX_FEES_RBTC"] = listReturnData[35];
    commission_rates_types["MINT_BPRO_FEES_MOC"] = listReturnData[36];
    commission_rates_types["REDEEM_BPRO_FEES_MOC"] = listReturnData[37];
    commission_rates_types["MINT_DOC_FEES_MOC"] = listReturnData[38];
    commission_rates_types["REDEEM_DOC_FEES_MOC"] = listReturnData[39];
    commission_rates_types["MINT_BTCX_FEES_MOC"] = listReturnData[40];
    commission_rates_types["REDEEM_BTCX_FEES_MOC"] = listReturnData[41];
  
    d_moc_state["commissionRatesTypes"] = commission_rates_types;
    d_moc_state["dayBlockSpan"] = listReturnData[42];
    d_moc_state["blockSpan"] = listReturnData[43];
    d_moc_state["blocksToSettlement"] = listReturnData[44];
    d_moc_state["state"] = listReturnData[45];
    d_moc_state["lastPriceUpdateHeight"] = 0;
    d_moc_state["paused"] = listReturnData[46];
    d_moc_state["liquidationEnabled"] = listReturnData[47];
    d_moc_state["protected"] = listReturnData[48];
    d_moc_state["getMoCToken"] = listReturnData[49];
    d_moc_state["getMoCPriceProvider"] = listReturnData[50];
    d_moc_state["getBtcPriceProvider"] = listReturnData[51];
    d_moc_state["getMoCVendors"] = listReturnData[52];

    // Commission rates
    const listMethodsRates = [
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_BPRO_FEES_RBTC"]).encodeABI(), 
            'uint256'
        ], // 0
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_BPRO_FEES_RBTC"]).encodeABI(), 
            'uint256'
        ], // 1
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_DOC_FEES_RBTC"]).encodeABI(), 
            'uint256'
        ], // 2
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_DOC_FEES_RBTC"]).encodeABI(), 
            'uint256'
        ], // 3
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_BTCX_FEES_RBTC"]).encodeABI(), 
            'uint256'
        ], // 4
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_BTCX_FEES_RBTC"]).encodeABI(), 
            'uint256'
        ], // 5
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_BPRO_FEES_MOC"]).encodeABI(), 
            'uint256'
        ], // 6
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_BPRO_FEES_MOC"]).encodeABI(), 
            'uint256'
        ], // 7
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_DOC_FEES_MOC"]).encodeABI(), 
            'uint256'
        ], // 8
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_DOC_FEES_MOC"]).encodeABI(), 
            'uint256'
        ], // 9
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_BTCX_FEES_MOC"]).encodeABI(), 
            'uint256'
        ], // 10
        [
            mocinrate.options.address, 
            mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_BTCX_FEES_MOC"]).encodeABI(), 
            'uint256'
        ] // 11
    ]

    // Remove decode result parameter
    const cleanListMethodsRates = listMethodsRates.map(x => [x[0], x[1]]);
  
    const multicallResultRates = await multicall.methods.tryBlockAndAggregate(false, cleanListMethodsRates).call();
      
    const listReturnDataRates = multicallResultRates[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData));

    const commission_rates = {};
    commission_rates["MINT_BPRO_FEES_RBTC"] = listReturnDataRates[0];
    commission_rates["REDEEM_BPRO_FEES_RBTC"] = listReturnDataRates[1];
    commission_rates["MINT_DOC_FEES_RBTC"] = listReturnDataRates[2];
    commission_rates["REDEEM_DOC_FEES_RBTC"] = listReturnDataRates[3];
    commission_rates["MINT_BTCX_FEES_RBTC"] = listReturnDataRates[4];
    commission_rates["REDEEM_BTCX_FEES_RBTC"] = listReturnDataRates[5];
    commission_rates["MINT_BPRO_FEES_MOC"] = listReturnDataRates[6];
    commission_rates["REDEEM_BPRO_FEES_MOC"] = listReturnDataRates[7];
    commission_rates["MINT_DOC_FEES_MOC"] = listReturnDataRates[8];
    commission_rates["REDEEM_DOC_FEES_MOC"] = listReturnDataRates[9];
    commission_rates["MINT_BTCX_FEES_MOC"] = listReturnDataRates[10];
    commission_rates["REDEEM_BTCX_FEES_MOC"] = listReturnDataRates[11];

    d_moc_state["commissionRates"] = commission_rates;
    
    return d_moc_state
  
  }

const userBalance  = async (web3, dContracts, userAddress) => {

    const multicall = dContracts["contracts"]["multicall"];
    const moc = dContracts["contracts"]["moc"];
    const mocinrate = dContracts["contracts"]["mocinrate"];
    const moctoken = dContracts["contracts"]["moctoken"];
    const bprotoken = dContracts["contracts"]["bprotoken"];
    const doctoken = dContracts["contracts"]["doctoken"];

    console.log(`Reading user balance ... account: ${userAddress}`);
        
    const listMethods = [
        [moctoken.options.address, moctoken.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 0
        [moctoken.options.address, moctoken.methods.allowance(userAddress, moc.options.address).encodeABI(), 'uint256'], // 1
        [doctoken.options.address, doctoken.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 2
        [bprotoken.options.address, bprotoken.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 3
        [multicall.options.address, multicall.methods.getEthBalance(userAddress).encodeABI(), 'uint256'], // 4
        [moc.options.address, moc.methods.docAmountToRedeem(userAddress).encodeABI(), 'uint256'], // 5
        [moc.options.address, moc.methods.bproxBalanceOf(BUCKET_X2, userAddress).encodeABI(), 'uint256'], // 6
    ]

    // Remove decode result parameter
    const cleanListMethods = listMethods.map(x => [x[0], x[1]]);
    const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call();        
    const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData));

    const userBalance = {};  
    userBalance["blockHeight"] = multicallResult[0];
    userBalance["mocBalance"] = listReturnData[0];
    userBalance["mocAllowance"] = listReturnData[1];
    userBalance["docBalance"] = listReturnData[2];
    userBalance["bproBalance"] = listReturnData[3];
    userBalance["rbtcBalance"] = listReturnData[4];
    userBalance["docToRedeem"] = listReturnData[5];
    userBalance["bprox2Balance"] = listReturnData[6];
    userBalance["potentialBprox2MaxInterest"] = "0";
    userBalance["bProHoldIncentive"] = "0";
    userBalance["estimateGasMintBpro"] = "2000000";
    userBalance["estimateGasMintDoc"] = "2000000";
    userBalance["estimateGasMintBprox2"] = "2000000";
    userBalance["userAddress"] = userAddress;

    const calcMintInterest = await mocinrate.methods.calcMintInterestValues(BUCKET_X2, userBalance["rbtcBalance"]).call();

    userBalance["potentialBprox2MaxInterest"] = calcMintInterest;    

    return userBalance

}

const formatUserBalance  = (userBalance) => {

    fmtUserBalance = {}
    fmtUserBalance["blockHeight"] = userBalance["blockHeight"];
    fmtUserBalance["mocBalance"] = Web3.utils.fromWei(userBalance["mocBalance"]);
    fmtUserBalance["mocAllowance"] = Web3.utils.fromWei(userBalance["mocAllowance"]);
    fmtUserBalance["docBalance"] = Web3.utils.fromWei(userBalance["docBalance"]);
    fmtUserBalance["bproBalance"] = Web3.utils.fromWei(userBalance["bproBalance"]);
    fmtUserBalance["rbtcBalance"] = Web3.utils.fromWei(userBalance["rbtcBalance"]);
    fmtUserBalance["docToRedeem"] = Web3.utils.fromWei(userBalance["docToRedeem"]);
    fmtUserBalance["bprox2Balance"] = Web3.utils.fromWei(userBalance["bprox2Balance"]);
    fmtUserBalance["potentialBprox2MaxInterest"] = userBalance["potentialBprox2MaxInterest"];
    fmtUserBalance["bProHoldIncentive"] = userBalance["bProHoldIncentive"];
    fmtUserBalance["estimateGasMintBpro"] = userBalance["estimateGasMintBpro"];
    fmtUserBalance["estimateGasMintDoc"] = userBalance["estimateGasMintDoc"];
    fmtUserBalance["estimateGasMintBprox2"] = userBalance["estimateGasMintBprox2"];
    fmtUserBalance["userAddress"] = userBalance["userAddress"];

    return fmtUserBalance

}

const renderUserBalance  = (userBalance) => {

    var render = `
User: ${userBalance["userAddress"]}
RBTC Balance: ${userBalance["rbtcBalance"]} RBTC
DOC Balance: ${userBalance["docBalance"]} DOC
BPRO Balance: ${userBalance["bproBalance"]} BPRO
BTCX Balance: ${userBalance["bprox2Balance"]} BTCX
MOC Balance: ${userBalance["mocBalance"]} MOC
MOC Allowance: ${userBalance["mocAllowance"]} MOC
DOC queue to redeem: ${userBalance["docToRedeem"]} DOC
    `;

    return render

}


const calcCommission  = async (web3, dContracts, amount) => {

    const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase();

    const multicall = dContracts["contracts"]["multicall"];
    const mocinrate = dContracts["contracts"]["mocinrate"];

    // Calculate commission with multicall
    const listMethods = [
        [mocinrate.options.address, mocinrate.methods.calcCommissionValue(amount, 3).encodeABI(), 'uint256'], // 0
        [mocinrate.options.address, mocinrate.methods.calculateVendorMarkup(vendorAddress, amount).encodeABI(), 'uint256'] // 1        
    ]

    // Remove decode result parameter
    const cleanListMethods = listMethods.map(x => [x[0], x[1]]);
    
    // Multicall results
    const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call();
    
    // Decode multicall
    const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData));

    // Dictionary commissions
    commission = {};
    commission["commission"] = new BN(listReturnData[0]);
    commission["vendorMarkup"] = new BN(listReturnData[1]);

    return commission;

}

const printEvent  = (evente) => { 
    
    console.log("");
    console.log('\x1b[35m%s\x1b[0m', `Event: ${evente.name}`);
    console.log("");
    evente.events.forEach(eve => console.log('\x1b[32m%s\x1b[0m', `${eve.name}: ${eve.value}`));    

}

const decodeEvents  = (receipt) => {

    const decodedLogs = abiDecoder.decodeLogs(receipt.logs);
    
    const filterIncludes = ["StableTokenMint"];
            
    const filteredEvents = decodedLogs.filter(event =>         
        filterIncludes.includes(event.name)
    );

    filteredEvents.forEach(evente => printEvent(evente));       
    
}

const sendTransaction  = async (web3, dContracts, value, estimateGas, encodedCall) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    const privateKey = process.env.USER_PK;
    const gasMultiplier = process.env.GAS_MULTIPLIER;

    console.log("Please wait... sending transaction... Wait until blockchain mine transaction!");

    // Get gas price from node
    const gasPrice = await web3.eth.getGasPrice();
        
    // Sign transaction need it PK
    const transaction = await web3.eth.accounts.signTransaction(
        {
            from: userAddress,
            to: dContracts["contracts"]["moc"]._address,
            value: value,
            gas: estimateGas * gasMultiplier,
            gasPrice: gasPrice,
            gasLimit: estimateGas * gasMultiplier,
            data: encodedCall,
        },
        privateKey
    );
    
    // Send transaction and get recipt
    const receipt = await web3.eth.sendSignedTransaction(
        transaction.rawTransaction
    );

    // Print decode events
    decodeEvents(receipt);    
        
    return receipt;

}

const mintDoc  = async (web3, dContracts, userAmount) => {

    const amount = new BN(userAmount * Math.pow(10, 18));    

    const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase();

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();

    // calculate commissions
    const commissions = await calcCommission(web3, dContracts, amount);

    // Calculate send values
    const value = amount.add(commissions["commission"]).add(commissions["vendorMarkup"]);

    const moc = dContracts["contracts"]["moc"];

    // Calculate estimate gas cost
    const estimateGas = await moc.methods
        .mintDocVendors(amount, vendorAddress)
        .estimateGas({ from: userAddress, value: value });

    const encodedCall = moc.methods
        .mintDocVendors(amount, vendorAddress)
        .encodeABI();

    const receipt = await sendTransaction(web3, dContracts, value, estimateGas, encodedCall);
    
    return receipt;

}

   
module.exports = {
    connectorAddresses,
    contractStatus,
    userBalance,
    readContracts,
    mintDoc,
    formatUserBalance,
    renderUserBalance
};