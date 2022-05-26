const BigNumber = require('bignumber.js');

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN });
const reservePrecision = new BigNumber(10).exponentiatedBy(18);

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

    const mocProject = `${process.env.MOC_PROJECT}`;
    let appMode;
    if (mocProject === "MoC") {
        appMode = "MoC";
    } else {
        appMode = "RRC20";
    }

    const multicall = dContracts["contracts"]["multicall"];
    const moc = dContracts["contracts"]["moc"];
    const mocstate = dContracts["contracts"]["mocstate"];
    const mocinrate = dContracts["contracts"]["mocinrate"];
    const mocsettlement = dContracts["contracts"]["mocsettlement"];

    console.log("Reading contract status ...");

    let listMethods;
    
    if (appMode === "MoC") {
        listMethods = [
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
    } else {
        listMethods = [
            [mocstate.options.address, mocstate.methods.getReserveTokenPrice().encodeABI(), 'uint256'], // 0
            [mocstate.options.address, mocstate.methods.getMoCPrice().encodeABI(), 'uint256'], // 1
            [mocstate.options.address, mocstate.methods.absoluteMaxRiskPro().encodeABI(), 'uint256'], // 2
            [mocstate.options.address, mocstate.methods.maxRiskProx(BUCKET_X2).encodeABI(), 'uint256'], // 3
            [mocstate.options.address, mocstate.methods.absoluteMaxStableToken().encodeABI(), 'uint256'], // 4
            [mocstate.options.address, mocstate.methods.freeStableToken().encodeABI(), 'uint256'], // 5
            [mocstate.options.address, mocstate.methods.leverage(BUCKET_C0).encodeABI(), 'uint256'], // 6
            [mocstate.options.address, mocstate.methods.cobj().encodeABI(), 'uint256'], // 7
            [mocstate.options.address, mocstate.methods.leverage(BUCKET_X2).encodeABI(), 'uint256'], // 8
            [mocstate.options.address, mocstate.methods.reserves().encodeABI(), 'uint256'], //9
            [mocstate.options.address, mocstate.methods.getExponentalMovingAverage().encodeABI(), 'uint256'], //10
            [mocstate.options.address, mocstate.methods.getInrateBag(BUCKET_C0).encodeABI(), 'uint256'], //11
            [mocstate.options.address, mocstate.methods.getBucketNReserve(BUCKET_C0).encodeABI(), 'uint256'], //12
            [mocstate.options.address, mocstate.methods.getBucketNStableToken(BUCKET_C0).encodeABI(), 'uint256'], //13
            [mocstate.options.address, mocstate.methods.getBucketNRiskPro(BUCKET_C0).encodeABI(), 'uint256'], //14
            [mocstate.options.address, mocstate.methods.getBucketNReserve(BUCKET_X2).encodeABI(), 'uint256'], //15
            [mocstate.options.address, mocstate.methods.getBucketNStableToken(BUCKET_X2).encodeABI(), 'uint256'], //16
            [mocstate.options.address, mocstate.methods.getBucketNRiskPro(BUCKET_X2).encodeABI(), 'uint256'], //17
            [mocstate.options.address, mocstate.methods.globalCoverage().encodeABI(), 'uint256'],  //18
            [moc.options.address, moc.methods.getReservePrecision().encodeABI(), 'uint256'], // 19
            [moc.options.address, moc.methods.getMocPrecision().encodeABI(), 'uint256'], //20
            [mocstate.options.address, mocstate.methods.coverage(BUCKET_X2).encodeABI(), 'uint256'], //21
            [mocstate.options.address, mocstate.methods.riskProTecPrice().encodeABI(), 'uint256'], //22
            [mocstate.options.address, mocstate.methods.riskProUsdPrice().encodeABI(), 'uint256'],  //23
            [mocstate.options.address, mocstate.methods.riskProSpotDiscountRate().encodeABI(), 'uint256'], //24
            [mocstate.options.address, mocstate.methods.maxRiskProWithDiscount().encodeABI(), 'uint256'],  //25
            [mocstate.options.address, mocstate.methods.riskProDiscountPrice().encodeABI(), 'uint256'], //26
            [mocstate.options.address, mocstate.methods.bucketRiskProTecPrice(BUCKET_X2).encodeABI(), 'uint256'], //27
            [mocstate.options.address, mocstate.methods.riskProxRiskProPrice(BUCKET_X2).encodeABI(), 'uint256'],  //28
            [mocinrate.options.address, mocinrate.methods.spotInrate().encodeABI(), 'uint256'], //29
            [mocinrate.options.address, mocinrate.methods.MINT_RISKPRO_FEES_RESERVE().encodeABI(), 'uint256'], //30
            [mocinrate.options.address, mocinrate.methods.REDEEM_RISKPRO_FEES_RESERVE().encodeABI(), 'uint256'], //31
            [mocinrate.options.address, mocinrate.methods.MINT_STABLETOKEN_FEES_RESERVE().encodeABI(), 'uint256'], //32
            [mocinrate.options.address, mocinrate.methods.REDEEM_STABLETOKEN_FEES_RESERVE().encodeABI(), 'uint256'], //33
            [mocinrate.options.address, mocinrate.methods.MINT_RISKPROX_FEES_RESERVE().encodeABI(), 'uint256'], //34
            [mocinrate.options.address, mocinrate.methods.REDEEM_RISKPROX_FEES_RESERVE().encodeABI(), 'uint256'], //35
            [mocinrate.options.address, mocinrate.methods.MINT_RISKPRO_FEES_MOC().encodeABI(), 'uint256'], //36
            [mocinrate.options.address, mocinrate.methods.REDEEM_RISKPRO_FEES_MOC().encodeABI(), 'uint256'], //37
            [mocinrate.options.address, mocinrate.methods.MINT_STABLETOKEN_FEES_MOC().encodeABI(), 'uint256'], //38
            [mocinrate.options.address, mocinrate.methods.REDEEM_STABLETOKEN_FEES_MOC().encodeABI(), 'uint256'], //39
            [mocinrate.options.address, mocinrate.methods.MINT_RISKPROX_FEES_MOC().encodeABI(), 'uint256'], //40
            [mocinrate.options.address, mocinrate.methods.REDEEM_RISKPROX_FEES_MOC().encodeABI(), 'uint256'], //41
            [mocstate.options.address, mocstate.methods.dayBlockSpan().encodeABI(), 'uint256'], //42
            [mocsettlement.options.address, mocsettlement.methods.getBlockSpan().encodeABI(), 'uint256'], //43
            [mocstate.options.address, mocstate.methods.blocksToSettlement().encodeABI(), 'uint256'], //44
            [mocstate.options.address, mocstate.methods.state().encodeABI(), 'uint256'], //45
            [moc.options.address, moc.methods.paused().encodeABI(), 'bool'], //46
            [mocstate.options.address, mocstate.methods.getLiquidationEnabled().encodeABI(), 'bool'], //47
            [mocstate.options.address, mocstate.methods.getProtected().encodeABI(), 'uint256'], //48
            [mocstate.options.address, mocstate.methods.getMoCToken().encodeABI(), 'address'], //49
            [mocstate.options.address, mocstate.methods.getMoCPriceProvider().encodeABI(), 'address'], //50
            [mocstate.options.address, mocstate.methods.getPriceProvider().encodeABI(), 'address'], //51
            [mocstate.options.address, mocstate.methods.getMoCVendors().encodeABI(), 'address'] //52
        ]

    }
    
  
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

    if (appMode === "MoC") { 
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
    } else {
        commission_rates_types["MINT_RISKPRO_FEES_RESERVE"] = listReturnData[30]
        commission_rates_types["REDEEM_RISKPRO_FEES_RESERVE"] = listReturnData[31]
        commission_rates_types["MINT_STABLETOKEN_FEES_RESERVE"] = listReturnData[32]
        commission_rates_types["REDEEM_STABLETOKEN_FEES_RESERVE"] = listReturnData[33]
        commission_rates_types["MINT_RISKPROX_FEES_RESERVE"] = listReturnData[34]
        commission_rates_types["REDEEM_RISKPROX_FEES_RESERVE"] = listReturnData[35]
        commission_rates_types["MINT_RISKPRO_FEES_MOC"] = listReturnData[36]
        commission_rates_types["REDEEM_RISKPRO_FEES_MOC"] = listReturnData[37]
        commission_rates_types["MINT_STABLETOKEN_FEES_MOC"] = listReturnData[38]
        commission_rates_types["REDEEM_STABLETOKEN_FEES_MOC"] = listReturnData[39]
        commission_rates_types["MINT_RISKPROX_FEES_MOC"] = listReturnData[40]
        commission_rates_types["REDEEM_RISKPROX_FEES_MOC"] = listReturnData[41]
    }
  
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
    let listMethodsRates;
    if (appMode === "MoC") { 
        listMethodsRates = [
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
    
    } else {        
        listMethodsRates = [
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_RISKPRO_FEES_RESERVE"]).encodeABI(), 
                'uint256'
            ], // 0
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_RISKPRO_FEES_RESERVE"]).encodeABI(), 
                'uint256'
            ], // 1
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_STABLETOKEN_FEES_RESERVE"]).encodeABI(), 
                'uint256'
            ], // 2
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_STABLETOKEN_FEES_RESERVE"]).encodeABI(), 
                'uint256'
            ], // 3
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_RISKPROX_FEES_RESERVE"]).encodeABI(), 
                'uint256'
            ], // 4
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_RISKPROX_FEES_RESERVE"]).encodeABI(), 
                'uint256'
            ], // 5
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_RISKPRO_FEES_MOC"]).encodeABI(), 
                'uint256'
            ], // 6
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_RISKPRO_FEES_MOC"]).encodeABI(), 
                'uint256'
            ], // 7
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_STABLETOKEN_FEES_MOC"]).encodeABI(), 
                'uint256'
            ], // 8
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_STABLETOKEN_FEES_MOC"]).encodeABI(), 
                'uint256'
            ], // 9
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["MINT_RISKPROX_FEES_MOC"]).encodeABI(), 
                'uint256'
            ], // 10
            [
                mocinrate.options.address, 
                mocinrate.methods.commissionRatesByTxType(d_moc_state["commissionRatesTypes"]["REDEEM_RISKPROX_FEES_MOC"]).encodeABI(), 
                'uint256'
            ] // 11
        ]
    }
    

    // Remove decode result parameter
    const cleanListMethodsRates = listMethodsRates.map(x => [x[0], x[1]]);
  
    const multicallResultRates = await multicall.methods.tryBlockAndAggregate(false, cleanListMethodsRates).call();
      
    const listReturnDataRates = multicallResultRates[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData));

    const commission_rates = {};

    if (appMode === "MoC") { 
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
    } else {
        commission_rates["MINT_RISKPRO_FEES_RESERVE"] = listReturnDataRates[0]
        commission_rates["REDEEM_RISKPRO_FEES_RESERVE"] = listReturnDataRates[1]
        commission_rates["MINT_STABLETOKEN_FEES_RESERVE"] = listReturnDataRates[2]
        commission_rates["REDEEM_STABLETOKEN_FEES_RESERVE"] = listReturnDataRates[3]
        commission_rates["MINT_RISKPROX_FEES_RESERVE"] = listReturnDataRates[4]
        commission_rates["REDEEM_RISKPROX_FEES_RESERVE"] = listReturnDataRates[5]
        commission_rates["MINT_RISKPRO_FEES_MOC"] = listReturnDataRates[6]
        commission_rates["REDEEM_RISKPRO_FEES_MOC"] = listReturnDataRates[7]
        commission_rates["MINT_STABLETOKEN_FEES_MOC"] = listReturnDataRates[8]
        commission_rates["REDEEM_STABLETOKEN_FEES_MOC"] = listReturnDataRates[9]
        commission_rates["MINT_RISKPROX_FEES_MOC"] = listReturnDataRates[10]
        commission_rates["REDEEM_RISKPROX_FEES_MOC"] = listReturnDataRates[11]
    }

    d_moc_state["commissionRates"] = commission_rates;
    
    return d_moc_state
  
  }

const renderContractStatus  = (contracStatus) => {

    var render = `
Bitcoin Price: ${Web3.utils.fromWei(contracStatus["bitcoinPrice"])} USD
Bitcoin EMA Price: ${Web3.utils.fromWei(contracStatus["bitcoinMovingAverage"])} USD
MoC Price: ${Web3.utils.fromWei(contracStatus["mocPrice"])} USD
BPRO Available to redeem: ${Web3.utils.fromWei(contracStatus["bproAvailableToRedeem"])} BPRO
BTCx Available to mint: ${Web3.utils.fromWei(contracStatus["bprox2AvailableToMint"])} BTCX
DOC Available to mint: ${Web3.utils.fromWei(contracStatus["docAvailableToMint"])} DOC
DOC Available to redeem: ${Web3.utils.fromWei(contracStatus["docAvailableToRedeem"])} DOC
BPRO Leverage: ${Web3.utils.fromWei(contracStatus["b0Leverage"])} 
BPRO Target Coverage: ${Web3.utils.fromWei(contracStatus["b0Leverage"])} 
Total BTC in contract: ${Web3.utils.fromWei(contracStatus["totalBTCAmount"])} 
Total BTC inrate Bag: ${Web3.utils.fromWei(contracStatus["b0BTCInrateBag"])} 
Global Coverage: ${Web3.utils.fromWei(contracStatus["globalCoverage"])} 
BTCx Coverage: ${Web3.utils.fromWei(contracStatus["x2Coverage"])} 
BTCx Leverage: ${Web3.utils.fromWei(contracStatus["x2Leverage"])} 
BPRO Price: ${Web3.utils.fromWei(contracStatus["bproPriceInUsd"])} USD
BTCx Price: ${Web3.utils.fromWei(contracStatus["bprox2PriceInRbtc"])} RBTC
Contract State: ${contracStatus["state"]} 
Contract Paused: ${contracStatus["paused"]} 
Contract Protected: ${contracStatus["protected"]} 
    `;

    return render;

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

const renderUserBalance  = (userBalance) => {

    var render = `
User: ${userBalance["userAddress"]}
RBTC Balance: ${Web3.utils.fromWei(userBalance["rbtcBalance"])} RBTC
DOC Balance: ${Web3.utils.fromWei(userBalance["docBalance"])} DOC
BPRO Balance: ${Web3.utils.fromWei(userBalance["bproBalance"])} BPRO
BTCX Balance: ${Web3.utils.fromWei(userBalance["bprox2Balance"])} BTCX
MOC Balance: ${Web3.utils.fromWei(userBalance["mocBalance"])} MOC
MOC Allowance: ${Web3.utils.fromWei(userBalance["mocAllowance"])} MOC
DOC queue to redeem: ${Web3.utils.fromWei(userBalance["docToRedeem"])} DOC
    `;

    return render;

}

const toContractPrecision  = (amount) => {
    return Web3.utils.toWei(amount.toFormat(18, BigNumber.ROUND_DOWN), 'ether');
}


const calcCommission  = async (web3, dContracts, dataContractStatus, reserveAmount, token, action) => {

    const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase();

    const multicall = dContracts["contracts"]["multicall"];
    const mocinrate = dContracts["contracts"]["mocinrate"];

    let moc_type;
    let reserve_type;
    switch (token) {
        case 'DOC':
            if (action === 'MINT') {
                reserve_type = dataContractStatus["commissionRatesTypes"]["MINT_DOC_FEES_RBTC"];
                moc_type = dataContractStatus["commissionRatesTypes"]["MINT_DOC_FEES_MOC"];
            } else {
                reserve_type = dataContractStatus["commissionRatesTypes"]["REDEEM_DOC_FEES_RBTC"];
                moc_type = dataContractStatus["commissionRatesTypes"]["REDEEM_DOC_FEES_MOC"];
            }            
            break;
        case 'BPRO':
            if (action === 'MINT') {
                reserve_type = dataContractStatus["commissionRatesTypes"]["MINT_BPRO_FEES_RBTC"];
                moc_type = dataContractStatus["commissionRatesTypes"]["MINT_BPRO_FEES_MOC"];
            } else {
                reserve_type = dataContractStatus["commissionRatesTypes"]["REDEEM_BPRO_FEES_RBTC"];
                moc_type = dataContractStatus["commissionRatesTypes"]["REDEEM_BPRO_FEES_MOC"];
            }
            break;
        case 'BTCX':
            if (action === 'MINT') {
                reserve_type = dataContractStatus["commissionRatesTypes"]["MINT_BTCX_FEES_RBTC"];
                moc_type = dataContractStatus["commissionRatesTypes"]["MINT_BTCX_FEES_MOC"];
            } else {
                reserve_type = dataContractStatus["commissionRatesTypes"]["REDEEM_BTCX_FEES_RBTC"];
                moc_type = dataContractStatus["commissionRatesTypes"]["REDEEM_BTCX_FEES_MOC"];
            }
            break;
      }
     
    
    // Calculate commission with multicall
    const listMethods = [
        [mocinrate.options.address, mocinrate.methods.calcCommissionValue(toContractPrecision(reserveAmount), reserve_type).encodeABI(), 'uint256'], // 0
        [mocinrate.options.address, mocinrate.methods.calcCommissionValue(toContractPrecision(reserveAmount), moc_type).encodeABI(), 'uint256'], // 1
        [mocinrate.options.address, mocinrate.methods.calculateVendorMarkup(vendorAddress, toContractPrecision(reserveAmount)).encodeABI(), 'uint256'] // 2
    ]
    
    // Remove decode result parameter
    const cleanListMethods = listMethods.map(x => [x[0], x[1]]);
    
    // Multicall results
    const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call();
    
    // Decode multicall
    const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData));

    // Dictionary commissions
    commission = {};
    commission["commission_reserve"] = listReturnData[0];
    commission["commission_moc"] = listReturnData[1];
    commission["vendorMarkup"] = listReturnData[2];

    return commission;

}

const addCommissions  = async (web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, token, action) => {

    // get reserve price from contract
    const reservePrice = new BigNumber(Web3.utils.fromWei(dataContractStatus["bitcoinPrice"]));

    // Get commissions from contracts
    const commissions = await calcCommission(web3, dContracts, dataContractStatus, reserveAmount, token, action);

    // Calculate commissions using Reserve payment(RBTC or RIF)
    const commissionInReserve = new BigNumber(Web3.utils.fromWei(commissions["commission_reserve"]))
                          .plus(new BigNumber(Web3.utils.fromWei(commissions["vendorMarkup"])));
    
    // Calculate commissions using MoC Token payment
    const commissionInMoc = new BigNumber(Web3.utils.fromWei(commissions["commission_moc"]))
                      .plus(new BigNumber(Web3.utils.fromWei(commissions["vendorMarkup"])))
                      .times(reservePrice).div(Web3.utils.fromWei(dataContractStatus["mocPrice"]));

    // Enough MoC to Pay commission with MoC Token                  
    const enoughMOCBalance = BigNumber(Web3.utils.fromWei(userBalanceStats["mocBalance"])).gte(commissionInMoc);

    // Enough MoC allowance to Pay commission with MoC Token
    const enoughMOCAllowance = BigNumber(Web3.utils.fromWei(userBalanceStats["mocAllowance"])).gt(0) 
                            && BigNumber(Web3.utils.fromWei(userBalanceStats["mocAllowance"])).gte(commissionInMoc);

    // add commission to value send
    let valueToSend;

    if (enoughMOCBalance && enoughMOCAllowance) {
        valueToSend = reserveAmount;
        console.log(`Paying commission with MoC Tokens: ${commissionInMoc} MOC`);
    } else {
        valueToSend = reserveAmount.plus(commissionInReserve);
        console.log(`Paying commission with RBTC: ${commissionInReserve} RBTC`);
    }

    return valueToSend;
}

const renderEventField  = (eveName, eveValue) => { 

    const formatItems = new Set([
        'amount', 
        'reserveTotal', 
        'reservePrice', 
        'mocCommissionValue', 
        'mocPrice', 
        'commission', 
        'mocCommissionValue', 
        'mocPrice', 
        'btcMarkup', 
        'mocMarkup', 
        'interests', 
        'leverage'])

    if (formatItems.has(eveName)) {eveValue = Web3.utils.fromWei(eveValue)}

    console.log('\x1b[32m%s\x1b[0m', `${eveName}: ${eveValue}`);

}


const renderEvent  = (evente) => { 
    
    console.log("");
    console.log('\x1b[35m%s\x1b[0m', `Event: ${evente.name}`);
    console.log("");
    evente.events.forEach(eve => renderEventField(eve.name, eve.value));

}

const decodeEvents  = (receipt) => {

    const decodedLogs = abiDecoder.decodeLogs(receipt.logs);
    
    const filterIncludes = [
        "StableTokenMint", 
        "StableTokenRedeem", 
        "FreeStableTokenRedeem",
        "RiskProMint", 
        "RiskProRedeem",
        "RiskProxMint",
        "RiskProxRedeem"
    ];
            
    const filteredEvents = decodedLogs.filter(event =>         
        filterIncludes.includes(event.name)
    );

    filteredEvents.forEach(evente => renderEvent(evente));       
    
}

const sendTransaction  = async (web3, value, estimateGas, encodedCall, toContract) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    const privateKey = process.env.USER_PK;
    const gasMultiplier = process.env.GAS_MULTIPLIER;

    console.log("Please wait... sending transaction... Wait until blockchain mine transaction!");

    let valueToSend;
    if ((typeof value === 'undefined') || value === null) {
        valueToSend = '0x';
    } else {
        valueToSend = toContractPrecision(value);
    }

    // Get gas price from node
    const gasPrice = await web3.eth.getGasPrice();
        
    // Sign transaction need it PK
    const transaction = await web3.eth.accounts.signTransaction(
        {
            from: userAddress,
            to: toContract,
            value: valueToSend,
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

const statusFromContracts  = async (web3, dContracts) => {

    // Read current status info from different contract MoCState.sol MoCInrate.sol 
    // MoCSettlement.sol MoC.sol in one call throught Multicall
    const dataContractStatus = await contractStatus(web3, dContracts);
    
    console.log('\x1b[35m%s\x1b[0m', `Contract Status`);
    console.log();
    console.log('\x1b[32m%s\x1b[0m', renderContractStatus(dataContractStatus));

    return dataContractStatus;

}

const userBalanceFromContracts  = async (web3, dContracts, userAddress) => {

    // Get user token and allowances balance
    const userBalanceStats = await userBalance(web3, dContracts, userAddress);
    
    console.log('\x1b[35m%s\x1b[0m', `User Balance: ${userAddress}`);
    console.log();
    console.log('\x1b[32m%s\x1b[0m', renderUserBalance(userBalanceStats));

    return userBalanceStats;

}

const AllowPayingCommissionMoC  = async (web3, dContracts, allow) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    const moctoken = dContracts["contracts"]["moctoken"];

    let amountAllowance = '0';
    const valueToSend = null;
    if (allow) {
        amountAllowance = Number.MAX_SAFE_INTEGER.toString();
    }

    // Calculate estimate gas cost
    const estimateGas = await moctoken.methods
        .approve(dContracts["contracts"]["moc"]._address, web3.utils.toWei(amountAllowance))
        .estimateGas({ from: userAddress, value: '0x' });

    // encode function     
    const encodedCall = moctoken.methods
        .approve(dContracts["contracts"]["moc"]._address, web3.utils.toWei(amountAllowance))
        .encodeABI();

    // send transaction to the blockchain and get receipt
    const receipt = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, moctoken._address);
    
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    
    return receipt;

}

const mintDoc  = async (web3, dContracts, docAmount) => {

    // Mint stable token with collateral coin base: RBTC

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase();
    const mintSlippage = `${process.env.MINT_SLIPPAGE}`;

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts);

    // Get user balance address
    const userBalanceStats = await userBalanceFromContracts(web3, dContracts, userAddress);
    
    // get bitcoin price from contract
    const bitcoinPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus["bitcoinPrice"]));

    // Doc amount in reserve (RBTC or RIF)
    const reserveAmount = new BigNumber(docAmount).div(bitcoinPrice);
    
    let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'DOC', 'MINT');

    // Add Slippage plus %
    const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount);
    
    valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount);

    console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`);
    
    // Verifications

    // User have suficient reserve to pay?
    console.log(`To mint ${docAmount} DOC you need > ${valueToSend.toString()} RBTC in your balance`);
    const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats["rbtcBalance"]));    
    if (valueToSend > userReserveBalance) throw new Error('Insuficient reserve balance');

    // There are suficient Doc in the contracts to mint?
    const docAvalaiblesToMint = new BigNumber(Web3.utils.fromWei(dataContractStatus["docAvailableToMint"]));    
    if (new BigNumber(docAmount) > docAvalaiblesToMint) throw new Error('Insuficient DoCs avalaibles to mint');  

    const moc = dContracts["contracts"]["moc"];

    // Calculate estimate gas cost
    const estimateGas = await moc.methods
        .mintDocVendors(toContractPrecision(reserveAmount), vendorAddress)
        .estimateGas({ from: userAddress, value: toContractPrecision(valueToSend) });

    // encode function     
    const encodedCall = moc.methods
        .mintDocVendors(toContractPrecision(reserveAmount), vendorAddress)
        .encodeABI();

    // send transaction to the blockchain and get receipt
    const receipt = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts["contracts"]["moc"]._address);
    
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    
    return receipt;

}

const redeemDoc  = async (web3, dContracts, docAmount) => {

    // Redeem stable token receiving coin base: RBTC

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase();

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts);

    // Get user balance address
    const userBalanceStats = await userBalanceFromContracts(web3, dContracts, userAddress);
        
    // get bitcoin price from contract
    const bitcoinPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus["bitcoinPrice"]));

    // Doc amount in reserve (RBTC or RIF)
    const reserveAmount = new BigNumber(docAmount).div(bitcoinPrice);

    // Redeem function... no values sent
    const valueToSend = null;    
        
    // Verifications

    // User have suficient DoCs in balance?
    console.log(`Redeeming ${docAmount} DOC ... getting aprox: ${reserveAmount} RBTC... `);
    const userDoCBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats["docBalance"]));    
    if (new BigNumber(docAmount) > userDoCBalance) throw new Error('Insuficient DoC user balance');

    // There are suficient Free Doc in the contracts to redeem?
    const docAvalaiblesToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus["docAvailableToRedeem"]));    
    if (new BigNumber(docAmount) > docAvalaiblesToRedeem) throw new Error('Insuficient DoCs avalaibles to redeem in contract');  

    const moc = dContracts["contracts"]["moc"];

    // Calculate estimate gas cost
    const estimateGas = await moc.methods
        .redeemFreeDocVendors(toContractPrecision(new BigNumber(docAmount)), vendorAddress)
        .estimateGas({ from: userAddress, value: '0x' });

    // encode function     
    const encodedCall = moc.methods
        .redeemFreeDocVendors(toContractPrecision(new BigNumber(docAmount)), vendorAddress)
        .encodeABI();

    // send transaction to the blockchain and get receipt
    const receipt = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts["contracts"]["moc"]._address);
    
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    
    return receipt;

}


const mintBPro  = async (web3, dContracts, bproAmount) => {

    // Mint BitPro token with collateral coin base: RBTC

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase();
    const mintSlippage = `${process.env.MINT_SLIPPAGE}`;

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts);

    // Get user balance address
    const userBalanceStats = await userBalanceFromContracts(web3, dContracts, userAddress);
        
    // Price of BPRO in RBTC
    const bproPriceInRbtc = new BigNumber(Web3.utils.fromWei(dataContractStatus["bproPriceInRbtc"]));
    
    // BPro amount in reserve (RBTC or RIF)
    const reserveAmount = new BigNumber(bproAmount).times(bproPriceInRbtc);
    
    let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'BPRO', 'MINT');

    // Add Slippage plus %
    const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount);
    
    valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount);

    console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`);
        
    // Verifications

    // User have suficient reserve to pay?
    console.log(`To mint ${bproAmount} BPro you need > ${valueToSend.toString()} RBTC in your balance`);
    const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats["rbtcBalance"]));    
    if (valueToSend > userReserveBalance) throw new Error('Insuficient reserve balance');
    
    const moc = dContracts["contracts"]["moc"];

    // Calculate estimate gas cost
    const estimateGas = await moc.methods
        .mintBProVendors(toContractPrecision(reserveAmount), vendorAddress)
        .estimateGas({ from: userAddress, value: toContractPrecision(valueToSend) });

    // encode function     
    const encodedCall = moc.methods
        .mintBProVendors(toContractPrecision(reserveAmount), vendorAddress)
        .encodeABI();

    // send transaction to the blockchain and get receipt
    const receipt = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts["contracts"]["moc"]._address);
    
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    
    return receipt;

}

const redeemBPro  = async (web3, dContracts, bproAmount) => {

    // Redeem BPro token receiving coin base: RBTC

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase();

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts);

    // Get user balance address
    const userBalanceStats = await userBalanceFromContracts(web3, dContracts, userAddress);
        
    // Price of BPRO in RBTC
    const bproPriceInRbtc = new BigNumber(Web3.utils.fromWei(dataContractStatus["bproPriceInRbtc"]));

    // Doc amount in reserve (RBTC or RIF)
    const reserveAmount = new BigNumber(bproAmount).times(bproPriceInRbtc);

    // Redeem function... no values sent
    const valueToSend = null;    
        
    // Verifications

    // User have suficient BPro in balance?
    console.log(`Redeeming ${bproAmount} BPRO ... getting aprox: ${reserveAmount} RBTC... `);
    const userBProBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats["bproBalance"]));    
    if (new BigNumber(bproAmount) > userBProBalance) throw new Error('Insuficient BPro user balance');

    // There are suficient BPro in the contracts to redeem?
    const bproAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus["bproAvailableToRedeem"]));    
    if (new BigNumber(bproAmount) > bproAvailableToRedeem) throw new Error('Insuficient BPro avalaibles to redeem in contract');  

    const moc = dContracts["contracts"]["moc"];

    // Calculate estimate gas cost
    const estimateGas = await moc.methods
        .redeemBProVendors(toContractPrecision(new BigNumber(bproAmount)), vendorAddress)
        .estimateGas({ from: userAddress, value: '0x' });

    // encode function     
    const encodedCall = moc.methods
        .redeemBProVendors(toContractPrecision(new BigNumber(bproAmount)), vendorAddress)
        .encodeABI();

    // send transaction to the blockchain and get receipt
    const receipt = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts["contracts"]["moc"]._address);
    
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    
    return receipt;

}

const calcMintInterest = async (dContracts, amount) => {

    const mocinrate = dContracts["contracts"]["mocinrate"];
    const calcMintInterest = await mocinrate.methods.calcMintInterestValues(BUCKET_X2, toContractPrecision(amount)).call();
    return calcMintInterest;
}

const mintBTCx  = async (web3, dContracts, btcxAmount) => {

    // Mint BTCx token with collateral coin base: RBTC

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase();
    const mintSlippage = `${process.env.MINT_SLIPPAGE}`;

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts);

    // Get user balance address
    const userBalanceStats = await userBalanceFromContracts(web3, dContracts, userAddress);
        
    // Price of BTCX in RBTC
    const bprox2PriceInRbtc = new BigNumber(Web3.utils.fromWei(dataContractStatus["bprox2PriceInRbtc"]));
    
    // BPro amount in reserve (RBTC or RIF)
    const reserveAmount = new BigNumber(btcxAmount).times(bprox2PriceInRbtc);
    
    let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'BTCX', 'MINT');

    // Calc Interest to mint BTCX
    const mintInterest = await calcMintInterest(dContracts, reserveAmount);

    valueToSend = new BigNumber(valueToSend).plus(new BigNumber(Web3.utils.fromWei(mintInterest)));

    console.log(`Mint BTCX Interest ${mintInterest}`);

    // Add Slippage plus %
    const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount);
    
    valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount);

    console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`);
            
    // Verifications

    // User have suficient reserve to pay?
    console.log(`To mint ${btcxAmount} BTCx you need > ${valueToSend.toString()} RBTC in your balance`);
    const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats["rbtcBalance"]));    
    if (valueToSend > userReserveBalance) throw new Error('Insuficient reserve balance');

    // There are suficient BTCX in the contracts to mint?
    const btcxAvalaiblesToMint = new BigNumber(Web3.utils.fromWei(dataContractStatus["bprox2AvailableToMint"]));    
    if (new BigNumber(btcxAmount) > btcxAvalaiblesToMint) throw new Error('Insuficient BTCx avalaibles to mint');  
    
    const moc = dContracts["contracts"]["moc"];

    // Calculate estimate gas cost
    const estimateGas = await moc.methods
        .mintBProxVendors(BUCKET_X2, toContractPrecision(reserveAmount), vendorAddress)
        .estimateGas({ from: userAddress, value: toContractPrecision(valueToSend) });

    // encode function     
    const encodedCall = moc.methods
        .mintBProxVendors(BUCKET_X2, toContractPrecision(reserveAmount), vendorAddress)
        .encodeABI();

    // send transaction to the blockchain and get receipt
    const receipt = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts["contracts"]["moc"]._address);
    
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    
    return receipt;

}

const redeemBTCx  = async (web3, dContracts, btcxAmount) => {

    // Redeem BTCx token receiving coin base: RBTC

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase();
    const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase();

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts);

    // Get user balance address
    const userBalanceStats = await userBalanceFromContracts(web3, dContracts, userAddress);
        
    // Price of BTCx in RBTC
    const btcxPriceInRbtc = new BigNumber(Web3.utils.fromWei(dataContractStatus["bprox2PriceInRbtc"]));

    // BTCx amount in reserve RBTC
    const reserveAmount = new BigNumber(btcxAmount).times(btcxPriceInRbtc);

    // Redeem function... no values sent
    const valueToSend = null;    
        
    // Verifications

    // User have suficient BTCx in balance?
    console.log(`Redeeming ${btcxAmount} BTCx ... getting aprox: ${reserveAmount} RBTC... `);
    const userBTCxBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats["bprox2Balance"]));    
    if (new BigNumber(btcxAmount) > userBTCxBalance) throw new Error('Insuficient BTCx user balance');
    
    const moc = dContracts["contracts"]["moc"];

    // Calculate estimate gas cost
    const estimateGas = await moc.methods
        .redeemBProxVendors(BUCKET_X2, toContractPrecision(new BigNumber(btcxAmount)), vendorAddress)
        .estimateGas({ from: userAddress, value: '0x' });

    // encode function     
    const encodedCall = moc.methods
        .redeemBProxVendors(BUCKET_X2, toContractPrecision(new BigNumber(btcxAmount)), vendorAddress)
        .encodeABI();

    // send transaction to the blockchain and get receipt
    const receipt = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts["contracts"]["moc"]._address);
    
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    
    return receipt;

}

   
module.exports = {
    connectorAddresses,
    contractStatus,
    userBalance,
    readContracts,
    mintDoc,
    redeemDoc,
    renderUserBalance,
    renderContractStatus,
    mintBPro,
    redeemBPro,
    mintBTCx,
    redeemBTCx,
    AllowPayingCommissionMoC
};