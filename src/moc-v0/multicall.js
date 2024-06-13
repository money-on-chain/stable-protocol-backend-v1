import { toContractPrecision, BUCKET_X2, BUCKET_C0 } from '../utils.js'

const connectorAddresses = async (web3, dContracts, configProject) => {
  const multicall = dContracts.contracts.multicall
  const mocconnector = dContracts.contracts.mocconnector
  const appMode = configProject.appMode

  const blockNumber = 6400000

  const listMethods = [
    [mocconnector.options.address, mocconnector.methods.mocState().encodeABI()],
    [mocconnector.options.address, mocconnector.methods.mocInrate().encodeABI()],
    [mocconnector.options.address, mocconnector.methods.mocExchange().encodeABI()],
    [mocconnector.options.address, mocconnector.methods.mocSettlement().encodeABI()]
  ]

  if (appMode === 'MoC') {
    listMethods.push([mocconnector.options.address, mocconnector.methods.docToken().encodeABI()])
    listMethods.push([mocconnector.options.address, mocconnector.methods.bproToken().encodeABI()])
    listMethods.push([mocconnector.options.address, mocconnector.methods.bproToken().encodeABI()])
  } else {
    listMethods.push([mocconnector.options.address, mocconnector.methods.stableToken().encodeABI()])
    listMethods.push([mocconnector.options.address, mocconnector.methods.riskProToken().encodeABI()])
    listMethods.push([mocconnector.options.address, mocconnector.methods.reserveToken().encodeABI()])
  }

  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, listMethods).call({}, blockNumber)

  const listReturnData = multicallResult[2].map(x => web3.eth.abi.decodeParameter('address', x.returnData))

  return listReturnData
}

const contractStatus = async (web3, dContracts, configProject) => {
  const appMode = configProject.appMode
  const appProject = configProject.appProject

  const multicall = dContracts.contracts.multicall
  const moc = dContracts.contracts.moc
  const mocstate = dContracts.contracts.mocstate
  const mocinrate = dContracts.contracts.mocinrate
  const mocsettlement = dContracts.contracts.mocsettlement
  const mocexchange = dContracts.contracts.mocexchange;

  const blockNumber = 6400000

  console.log('Reading contract status ...')

  let listMethods

  if (appMode === 'MoC') {
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
      [mocstate.options.address, mocstate.methods.rbtcInSystem().encodeABI(), 'uint256'], // 9
      [mocstate.options.address, mocstate.methods.getBitcoinMovingAverage().encodeABI(), 'uint256'], // 10
      [mocstate.options.address, mocstate.methods.getInrateBag(BUCKET_C0).encodeABI(), 'uint256'], // 11
      [mocstate.options.address, mocstate.methods.getBucketNBTC(BUCKET_C0).encodeABI(), 'uint256'], // 12
      [mocstate.options.address, mocstate.methods.getBucketNDoc(BUCKET_C0).encodeABI(), 'uint256'], // 13
      [mocstate.options.address, mocstate.methods.getBucketNBPro(BUCKET_C0).encodeABI(), 'uint256'], // 14
      [mocstate.options.address, mocstate.methods.getBucketNBTC(BUCKET_X2).encodeABI(), 'uint256'], // 15
      [mocstate.options.address, mocstate.methods.getBucketNDoc(BUCKET_X2).encodeABI(), 'uint256'], // 16
      [mocstate.options.address, mocstate.methods.getBucketNBPro(BUCKET_X2).encodeABI(), 'uint256'], // 17
      [mocstate.options.address, mocstate.methods.globalCoverage().encodeABI(), 'uint256'], // 18
      [moc.options.address, moc.methods.getReservePrecision().encodeABI(), 'uint256'], // 19
      [moc.options.address, moc.methods.getMocPrecision().encodeABI(), 'uint256'], // 20
      [mocstate.options.address, mocstate.methods.coverage(BUCKET_X2).encodeABI(), 'uint256'], // 21
      [mocstate.options.address, mocstate.methods.bproTecPrice().encodeABI(), 'uint256'], // 22
      [mocstate.options.address, mocstate.methods.bproUsdPrice().encodeABI(), 'uint256'], // 23
      [mocstate.options.address, mocstate.methods.bproSpotDiscountRate().encodeABI(), 'uint256'], // 24
      [mocstate.options.address, mocstate.methods.maxBProWithDiscount().encodeABI(), 'uint256'], // 25
      [mocstate.options.address, mocstate.methods.bproDiscountPrice().encodeABI(), 'uint256'], // 26
      [mocstate.options.address, mocstate.methods.bucketBProTecPrice(BUCKET_X2).encodeABI(), 'uint256'], // 27
      [mocstate.options.address, mocstate.methods.bproxBProPrice(BUCKET_X2).encodeABI(), 'uint256'], // 28
      [mocinrate.options.address, mocinrate.methods.spotInrate().encodeABI(), 'uint256'], // 29
      [mocinrate.options.address, mocinrate.methods.MINT_BPRO_FEES_RBTC().encodeABI(), 'uint256'], // 30
      [mocinrate.options.address, mocinrate.methods.REDEEM_BPRO_FEES_RBTC().encodeABI(), 'uint256'], // 31
      [mocinrate.options.address, mocinrate.methods.MINT_DOC_FEES_RBTC().encodeABI(), 'uint256'], // 32
      [mocinrate.options.address, mocinrate.methods.REDEEM_DOC_FEES_RBTC().encodeABI(), 'uint256'], // 33
      [mocinrate.options.address, mocinrate.methods.MINT_BTCX_FEES_RBTC().encodeABI(), 'uint256'], // 34
      [mocinrate.options.address, mocinrate.methods.REDEEM_BTCX_FEES_RBTC().encodeABI(), 'uint256'], // 35
      [mocinrate.options.address, mocinrate.methods.MINT_BPRO_FEES_MOC().encodeABI(), 'uint256'], // 36
      [mocinrate.options.address, mocinrate.methods.REDEEM_BPRO_FEES_MOC().encodeABI(), 'uint256'], // 37
      [mocinrate.options.address, mocinrate.methods.MINT_DOC_FEES_MOC().encodeABI(), 'uint256'], // 38
      [mocinrate.options.address, mocinrate.methods.REDEEM_DOC_FEES_MOC().encodeABI(), 'uint256'], // 39
      [mocinrate.options.address, mocinrate.methods.MINT_BTCX_FEES_MOC().encodeABI(), 'uint256'], // 40
      [mocinrate.options.address, mocinrate.methods.REDEEM_BTCX_FEES_MOC().encodeABI(), 'uint256'], // 41
      [mocstate.options.address, mocstate.methods.dayBlockSpan().encodeABI(), 'uint256'], // 42
      [mocsettlement.options.address, mocsettlement.methods.getBlockSpan().encodeABI(), 'uint256'], // 43
      [mocstate.options.address, mocstate.methods.blocksToSettlement().encodeABI(), 'uint256'], // 44
      [mocstate.options.address, mocstate.methods.state().encodeABI(), 'uint256'], // 45
      [moc.options.address, moc.methods.paused().encodeABI(), 'bool'], // 46
      [mocstate.options.address, mocstate.methods.getLiquidationEnabled().encodeABI(), 'bool'], // 47
      [mocstate.options.address, mocstate.methods.getProtected().encodeABI(), 'uint256'], // 48
      [mocstate.options.address, mocstate.methods.getMoCToken().encodeABI(), 'address'], // 49
      [mocstate.options.address, mocstate.methods.getMoCPriceProvider().encodeABI(), 'address'], // 50
      [mocstate.options.address, mocstate.methods.getBtcPriceProvider().encodeABI(), 'address'], // 51
      [mocstate.options.address, mocstate.methods.getMoCVendors().encodeABI(), 'address'] // 52
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
      [mocstate.options.address, mocstate.methods.reserves().encodeABI(), 'uint256'], // 9
      [mocstate.options.address, mocstate.methods.getExponentalMovingAverage().encodeABI(), 'uint256'], // 10
      [mocstate.options.address, mocstate.methods.getInrateBag(BUCKET_C0).encodeABI(), 'uint256'], // 11
      [mocstate.options.address, mocstate.methods.getBucketNReserve(BUCKET_C0).encodeABI(), 'uint256'], // 12
      [mocstate.options.address, mocstate.methods.getBucketNStableToken(BUCKET_C0).encodeABI(), 'uint256'], // 13
      [mocstate.options.address, mocstate.methods.getBucketNRiskPro(BUCKET_C0).encodeABI(), 'uint256'], // 14
      [mocstate.options.address, mocstate.methods.getBucketNReserve(BUCKET_X2).encodeABI(), 'uint256'], // 15
      [mocstate.options.address, mocstate.methods.getBucketNStableToken(BUCKET_X2).encodeABI(), 'uint256'], // 16
      [mocstate.options.address, mocstate.methods.getBucketNRiskPro(BUCKET_X2).encodeABI(), 'uint256'], // 17
      [mocstate.options.address, mocstate.methods.globalCoverage().encodeABI(), 'uint256'], // 18
      [moc.options.address, moc.methods.getReservePrecision().encodeABI(), 'uint256'], // 19
      [moc.options.address, moc.methods.getMocPrecision().encodeABI(), 'uint256'], // 20
      [mocstate.options.address, mocstate.methods.coverage(BUCKET_X2).encodeABI(), 'uint256'], // 21
      [mocstate.options.address, mocstate.methods.riskProTecPrice().encodeABI(), 'uint256'], // 22
      [mocstate.options.address, mocstate.methods.riskProUsdPrice().encodeABI(), 'uint256'], // 23
      [mocstate.options.address, mocstate.methods.riskProSpotDiscountRate().encodeABI(), 'uint256'], // 24
      [mocstate.options.address, mocstate.methods.maxRiskProWithDiscount().encodeABI(), 'uint256'], // 25
      [mocstate.options.address, mocstate.methods.riskProDiscountPrice().encodeABI(), 'uint256'], // 26
      [mocstate.options.address, mocstate.methods.bucketRiskProTecPrice(BUCKET_X2).encodeABI(), 'uint256'], // 27
      [mocstate.options.address, mocstate.methods.riskProxRiskProPrice(BUCKET_X2).encodeABI(), 'uint256'], // 28
      [mocinrate.options.address, mocinrate.methods.spotInrate().encodeABI(), 'uint256'], // 29
      [mocinrate.options.address, mocinrate.methods.MINT_RISKPRO_FEES_RESERVE().encodeABI(), 'uint256'], // 30
      [mocinrate.options.address, mocinrate.methods.REDEEM_RISKPRO_FEES_RESERVE().encodeABI(), 'uint256'], // 31
      [mocinrate.options.address, mocinrate.methods.MINT_STABLETOKEN_FEES_RESERVE().encodeABI(), 'uint256'], // 32
      [mocinrate.options.address, mocinrate.methods.REDEEM_STABLETOKEN_FEES_RESERVE().encodeABI(), 'uint256'], // 33
      [mocinrate.options.address, mocinrate.methods.MINT_RISKPROX_FEES_RESERVE().encodeABI(), 'uint256'], // 34
      [mocinrate.options.address, mocinrate.methods.REDEEM_RISKPROX_FEES_RESERVE().encodeABI(), 'uint256'], // 35
      [mocinrate.options.address, mocinrate.methods.MINT_RISKPRO_FEES_MOC().encodeABI(), 'uint256'], // 36
      [mocinrate.options.address, mocinrate.methods.REDEEM_RISKPRO_FEES_MOC().encodeABI(), 'uint256'], // 37
      [mocinrate.options.address, mocinrate.methods.MINT_STABLETOKEN_FEES_MOC().encodeABI(), 'uint256'], // 38
      [mocinrate.options.address, mocinrate.methods.REDEEM_STABLETOKEN_FEES_MOC().encodeABI(), 'uint256'], // 39
      [mocinrate.options.address, mocinrate.methods.MINT_RISKPROX_FEES_MOC().encodeABI(), 'uint256'], // 40
      [mocinrate.options.address, mocinrate.methods.REDEEM_RISKPROX_FEES_MOC().encodeABI(), 'uint256'], // 41
      [mocstate.options.address, mocstate.methods.dayBlockSpan().encodeABI(), 'uint256'], // 42
      [mocsettlement.options.address, mocsettlement.methods.getBlockSpan().encodeABI(), 'uint256'], // 43
      [mocstate.options.address, mocstate.methods.blocksToSettlement().encodeABI(), 'uint256'], // 44
      [mocstate.options.address, mocstate.methods.state().encodeABI(), 'uint256'], // 45
      [moc.options.address, moc.methods.paused().encodeABI(), 'bool'], // 46
      [mocstate.options.address, mocstate.methods.getLiquidationEnabled().encodeABI(), 'bool'], // 47
      [mocstate.options.address, mocstate.methods.getProtected().encodeABI(), 'uint256'], // 48
      [mocstate.options.address, mocstate.methods.getMoCToken().encodeABI(), 'address'], // 49
      [mocstate.options.address, mocstate.methods.getMoCPriceProvider().encodeABI(), 'address'], // 50
      [mocstate.options.address, mocstate.methods.getPriceProvider().encodeABI(), 'address'], // 51
      [mocstate.options.address, mocstate.methods.getMoCVendors().encodeABI(), 'address'], // 52
      [mocexchange.options.address, mocexchange.methods.maxAbsoluteOperation().encodeABI(), 'uint256'], // 53
      [mocexchange.options.address, mocexchange.methods.maxOperationalDifference().encodeABI(), 'uint256'], // 54
      [mocexchange.options.address, mocexchange.methods.decayBlockSpan().encodeABI(), 'uint256'], // 55
      [mocexchange.options.address, mocexchange.methods.absoluteAccumulator().encodeABI(), 'uint256'], // 56
      [mocexchange.options.address, mocexchange.methods.differentialAccumulator().encodeABI(), 'uint256'], // 57
      [mocexchange.options.address, mocexchange.methods.lastOperationBlockNumber().encodeABI(), 'uint256'], // 58
      [mocexchange.options.address, mocexchange.methods.lastMaxReserveAllowedToMint().encodeABI(), 'uint256'], // 59
      [mocexchange.options.address, mocexchange.methods.maxReserveAllowedToMint().encodeABI(), 'uint256'], // 60
      [mocexchange.options.address, mocexchange.methods.maxReserveAllowedToRedeem().encodeABI(), 'uint256'], // 61
      [mocexchange.options.address, mocexchange.methods.lastMaxReserveAllowedToRedeem().encodeABI(), 'uint256'] // 62
    ]
  }

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])

  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call({}, blockNumber)

  const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))

  const dMocState = {}
  dMocState.blockHeight = multicallResult[0]
  dMocState.bitcoinPrice = listReturnData[0]
  dMocState.mocPrice = listReturnData[1]
  dMocState.bproAvailableToRedeem = listReturnData[2]
  dMocState.bprox2AvailableToMint = listReturnData[3]
  dMocState.docAvailableToMint = listReturnData[4]
  dMocState.docAvailableToRedeem = listReturnData[5]
  dMocState.b0Leverage = listReturnData[6]
  dMocState.b0TargetCoverage = listReturnData[7]
  dMocState.x2Leverage = listReturnData[8]
  dMocState.totalBTCAmount = listReturnData[9]
  dMocState.bitcoinMovingAverage = listReturnData[10]
  dMocState.b0BTCInrateBag = listReturnData[11]
  dMocState.b0BTCAmount = listReturnData[12]
  dMocState.b0DocAmount = listReturnData[13]
  dMocState.b0BproAmount = listReturnData[14]
  dMocState.x2BTCAmount = listReturnData[15]
  dMocState.x2DocAmount = listReturnData[16]
  dMocState.x2BproAmount = listReturnData[17]
  dMocState.globalCoverage = listReturnData[18]
  dMocState.reservePrecision = listReturnData[19]
  dMocState.mocPrecision = listReturnData[20]
  dMocState.x2Coverage = listReturnData[21]
  dMocState.bproPriceInRbtc = listReturnData[22]
  dMocState.bproPriceInUsd = listReturnData[23]
  dMocState.bproDiscountRate = listReturnData[24]
  dMocState.maxBproWithDiscount = listReturnData[25]
  dMocState.bproDiscountPrice = listReturnData[26]
  dMocState.bprox2PriceInRbtc = listReturnData[27]
  dMocState.bprox2PriceInBpro = listReturnData[28]
  dMocState.spotInrate = listReturnData[29]

  const commissionRatesTypes = {}

  if (appMode === 'MoC') {
    commissionRatesTypes.MINT_BPRO_FEES_RBTC = listReturnData[30]
    commissionRatesTypes.REDEEM_BPRO_FEES_RBTC = listReturnData[31]
    commissionRatesTypes.MINT_DOC_FEES_RBTC = listReturnData[32]
    commissionRatesTypes.REDEEM_DOC_FEES_RBTC = listReturnData[33]
    commissionRatesTypes.MINT_BTCX_FEES_RBTC = listReturnData[34]
    commissionRatesTypes.REDEEM_BTCX_FEES_RBTC = listReturnData[35]
    commissionRatesTypes.MINT_BPRO_FEES_MOC = listReturnData[36]
    commissionRatesTypes.REDEEM_BPRO_FEES_MOC = listReturnData[37]
    commissionRatesTypes.MINT_DOC_FEES_MOC = listReturnData[38]
    commissionRatesTypes.REDEEM_DOC_FEES_MOC = listReturnData[39]
    commissionRatesTypes.MINT_BTCX_FEES_MOC = listReturnData[40]
    commissionRatesTypes.REDEEM_BTCX_FEES_MOC = listReturnData[41]
  } else {
    commissionRatesTypes.MINT_RISKPRO_FEES_RESERVE = listReturnData[30]
    commissionRatesTypes.REDEEM_RISKPRO_FEES_RESERVE = listReturnData[31]
    commissionRatesTypes.MINT_STABLETOKEN_FEES_RESERVE = listReturnData[32]
    commissionRatesTypes.REDEEM_STABLETOKEN_FEES_RESERVE = listReturnData[33]
    commissionRatesTypes.MINT_RISKPROX_FEES_RESERVE = listReturnData[34]
    commissionRatesTypes.REDEEM_RISKPROX_FEES_RESERVE = listReturnData[35]
    commissionRatesTypes.MINT_RISKPRO_FEES_MOC = listReturnData[36]
    commissionRatesTypes.REDEEM_RISKPRO_FEES_MOC = listReturnData[37]
    commissionRatesTypes.MINT_STABLETOKEN_FEES_MOC = listReturnData[38]
    commissionRatesTypes.REDEEM_STABLETOKEN_FEES_MOC = listReturnData[39]
    commissionRatesTypes.MINT_RISKPROX_FEES_MOC = listReturnData[40]
    commissionRatesTypes.REDEEM_RISKPROX_FEES_MOC = listReturnData[41]
  }

  dMocState.commissionRatesTypes = commissionRatesTypes
  dMocState.dayBlockSpan = listReturnData[42]
  dMocState.blockSpan = listReturnData[43]
  dMocState.blocksToSettlement = listReturnData[44]
  dMocState.state = listReturnData[45]
  dMocState.lastPriceUpdateHeight = 0
  dMocState.paused = listReturnData[46]
  dMocState.liquidationEnabled = listReturnData[47]
  dMocState.protected = listReturnData[48]
  dMocState.getMoCToken = listReturnData[49]
  dMocState.getMoCPriceProvider = listReturnData[50]
  dMocState.getBtcPriceProvider = listReturnData[51]
  dMocState.getMoCVendors = listReturnData[52]

  // Flux capacitor only enabled in RRC20 app mode
  if (appMode === 'RRC20') {
    dMocState.maxAbsoluteOperation = listReturnData[53];
    dMocState.maxOperationalDifference = listReturnData[54];
    dMocState.decayBlockSpan = listReturnData[55];
    dMocState.absoluteAccumulator = listReturnData[56];
    dMocState.differentialAccumulator = listReturnData[57];
    dMocState.lastOperationBlockNumber = listReturnData[58];
    dMocState.lastMaxReserveAllowedToMint = listReturnData[59];
    dMocState.maxReserveAllowedToMint = listReturnData[60];
    dMocState.maxReserveAllowedToRedeem = listReturnData[61];
    dMocState.lastMaxReserveAllowedToRedeem = listReturnData[62];
  }

  // Commission rates
  let listMethodsRates
  if (appMode === 'MoC') {
    listMethodsRates = [
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_BPRO_FEES_RBTC).encodeABI(),
        'uint256'
      ], // 0
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_BPRO_FEES_RBTC).encodeABI(),
        'uint256'
      ], // 1
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_DOC_FEES_RBTC).encodeABI(),
        'uint256'
      ], // 2
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_DOC_FEES_RBTC).encodeABI(),
        'uint256'
      ], // 3
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_BTCX_FEES_RBTC).encodeABI(),
        'uint256'
      ], // 4
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_BTCX_FEES_RBTC).encodeABI(),
        'uint256'
      ], // 5
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_BPRO_FEES_MOC).encodeABI(),
        'uint256'
      ], // 6
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_BPRO_FEES_MOC).encodeABI(),
        'uint256'
      ], // 7
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_DOC_FEES_MOC).encodeABI(),
        'uint256'
      ], // 8
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_DOC_FEES_MOC).encodeABI(),
        'uint256'
      ], // 9
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_BTCX_FEES_MOC).encodeABI(),
        'uint256'
      ], // 10
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_BTCX_FEES_MOC).encodeABI(),
        'uint256'
      ] // 11
    ]
  } else {
    listMethodsRates = [
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_RISKPRO_FEES_RESERVE).encodeABI(),
        'uint256'
      ], // 0
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_RISKPRO_FEES_RESERVE).encodeABI(),
        'uint256'
      ], // 1
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_STABLETOKEN_FEES_RESERVE).encodeABI(),
        'uint256'
      ], // 2
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_STABLETOKEN_FEES_RESERVE).encodeABI(),
        'uint256'
      ], // 3
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_RISKPROX_FEES_RESERVE).encodeABI(),
        'uint256'
      ], // 4
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_RISKPROX_FEES_RESERVE).encodeABI(),
        'uint256'
      ], // 5
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_RISKPRO_FEES_MOC).encodeABI(),
        'uint256'
      ], // 6
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_RISKPRO_FEES_MOC).encodeABI(),
        'uint256'
      ], // 7
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_STABLETOKEN_FEES_MOC).encodeABI(),
        'uint256'
      ], // 8
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_STABLETOKEN_FEES_MOC).encodeABI(),
        'uint256'
      ], // 9
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.MINT_RISKPROX_FEES_MOC).encodeABI(),
        'uint256'
      ], // 10
      [
        mocinrate.options.address,
        mocinrate.methods.commissionRatesByTxType(dMocState.commissionRatesTypes.REDEEM_RISKPROX_FEES_MOC).encodeABI(),
        'uint256'
      ] // 11
    ]
  }

  // Remove decode result parameter
  const cleanListMethodsRates = listMethodsRates.map(x => [x[0], x[1]])

  const multicallResultRates = await multicall.methods.tryBlockAndAggregate(false, cleanListMethodsRates).call({}, blockNumber)

  const listReturnDataRates = multicallResultRates[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))

  const commissionRates = {}

  if (appMode === 'MoC') {
    commissionRates.MINT_BPRO_FEES_RBTC = listReturnDataRates[0]
    commissionRates.REDEEM_BPRO_FEES_RBTC = listReturnDataRates[1]
    commissionRates.MINT_DOC_FEES_RBTC = listReturnDataRates[2]
    commissionRates.REDEEM_DOC_FEES_RBTC = listReturnDataRates[3]
    commissionRates.MINT_BTCX_FEES_RBTC = listReturnDataRates[4]
    commissionRates.REDEEM_BTCX_FEES_RBTC = listReturnDataRates[5]
    commissionRates.MINT_BPRO_FEES_MOC = listReturnDataRates[6]
    commissionRates.REDEEM_BPRO_FEES_MOC = listReturnDataRates[7]
    commissionRates.MINT_DOC_FEES_MOC = listReturnDataRates[8]
    commissionRates.REDEEM_DOC_FEES_MOC = listReturnDataRates[9]
    commissionRates.MINT_BTCX_FEES_MOC = listReturnDataRates[10]
    commissionRates.REDEEM_BTCX_FEES_MOC = listReturnDataRates[11]
  } else {
    commissionRates.MINT_RISKPRO_FEES_RESERVE = listReturnDataRates[0]
    commissionRates.REDEEM_RISKPRO_FEES_RESERVE = listReturnDataRates[1]
    commissionRates.MINT_STABLETOKEN_FEES_RESERVE = listReturnDataRates[2]
    commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE = listReturnDataRates[3]
    commissionRates.MINT_RISKPROX_FEES_RESERVE = listReturnDataRates[4]
    commissionRates.REDEEM_RISKPROX_FEES_RESERVE = listReturnDataRates[5]
    commissionRates.MINT_RISKPRO_FEES_MOC = listReturnDataRates[6]
    commissionRates.REDEEM_RISKPRO_FEES_MOC = listReturnDataRates[7]
    commissionRates.MINT_STABLETOKEN_FEES_MOC = listReturnDataRates[8]
    commissionRates.REDEEM_STABLETOKEN_FEES_MOC = listReturnDataRates[9]
    commissionRates.MINT_RISKPROX_FEES_MOC = listReturnDataRates[10]
    commissionRates.REDEEM_RISKPROX_FEES_MOC = listReturnDataRates[11]
  }

  dMocState.commissionRates = commissionRates

  if (appProject === 'bnb') return dMocState  // need archive

  // Historics Price 24hs ago
  const d24BlockHeights = dMocState.blockHeight - dMocState.dayBlockSpan;
  // Remove decode result parameter
  if (appMode === 'MoC') {
    listMethods = [
      [mocstate.options.address, mocstate.methods.getBitcoinPrice().encodeABI(), 'uint256'], // 0
      [mocstate.options.address, mocstate.methods.getMoCPrice().encodeABI(), 'uint256'], // 1
      [mocstate.options.address, mocstate.methods.bproUsdPrice().encodeABI(), 'uint256'], // 2
      [mocstate.options.address, mocstate.methods.bucketBProTecPrice(BUCKET_X2).encodeABI(), 'uint256'], // 3
    ]
  } else {
    listMethods = [
      [mocstate.options.address, mocstate.methods.getReserveTokenPrice().encodeABI(), 'uint256'], // 0
      [mocstate.options.address, mocstate.methods.getMoCPrice().encodeABI(), 'uint256'], // 1
      [mocstate.options.address, mocstate.methods.riskProUsdPrice().encodeABI(), 'uint256'], // 2
      [mocstate.options.address, mocstate.methods.bucketRiskProTecPrice(BUCKET_X2).encodeABI(), 'uint256'], // 3
    ]
  }

  const cleanListMethodsHistoric = listMethods.map(x => [x[0], x[1]])

  const multicallResultHistoric = await multicall.methods.tryBlockAndAggregate(false, cleanListMethodsHistoric).call({}, blockNumber)

  const listReturnDataHistoric = multicallResultHistoric[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))

  const historic = {}
  historic.bitcoinPrice = listReturnDataHistoric[0]
  historic.mocPrice = listReturnDataHistoric[1]
  historic.bproPriceInUsd = listReturnDataHistoric[2]
  historic.bprox2PriceInRbtc = listReturnDataHistoric[3]
  historic.blockHeight = d24BlockHeights

  dMocState.historic = historic

  return dMocState
}

const userBalance = async (web3, dContracts, userAddress, configProject) => {
  const appMode = configProject.appMode

  const multicall = dContracts.contracts.multicall
  const moc = dContracts.contracts.moc
  const mocinrate = dContracts.contracts.mocinrate
  const tg = dContracts.contracts.tg
  const tc = dContracts.contracts.tc
  const tp = dContracts.contracts.tp

  console.log(`Reading user balance ... account: ${userAddress}`)

  const listMethods = [
    [tg.options.address, tg.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 0
    [tg.options.address, tg.methods.allowance(userAddress, moc.options.address).encodeABI(), 'uint256'], // 1
    [tp.options.address, tp.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 2
    [tc.options.address, tc.methods.balanceOf(userAddress).encodeABI(), 'uint256'] // 3
  ]

  if (appMode === 'MoC') {
    listMethods.push([multicall.options.address, multicall.methods.getEthBalance(userAddress).encodeABI(), 'uint256']) // 4
    listMethods.push([moc.options.address, moc.methods.docAmountToRedeem(userAddress).encodeABI(), 'uint256']) // 5
    listMethods.push([moc.options.address, moc.methods.bproxBalanceOf(BUCKET_X2, userAddress).encodeABI(), 'uint256']) // 6
    listMethods.push([multicall.options.address, multicall.methods.getEthBalance(userAddress).encodeABI(), 'uint256']) // 7
  } else {
    const reservetoken = dContracts.contracts.reservetoken
    listMethods.push([reservetoken.options.address, reservetoken.methods.balanceOf(userAddress).encodeABI(), 'uint256']) // 4
    listMethods.push([moc.options.address, moc.methods.stableTokenAmountToRedeem(userAddress).encodeABI(), 'uint256']) // 5
    listMethods.push([moc.options.address, moc.methods.riskProxBalanceOf(BUCKET_X2, userAddress).encodeABI(), 'uint256']) // 6
    listMethods.push([reservetoken.options.address, reservetoken.methods.allowance(userAddress, dContracts.contracts.moc._address).encodeABI(), 'uint256']) // 7
  }

  // Token migrator
  if (dContracts.contracts.tp_legacy) {
    const tpLegacy = dContracts.contracts.tp_legacy
    const tokenMigrator = dContracts.contracts.token_migrator
    listMethods.push([tpLegacy.options.address, tpLegacy.methods.balanceOf(userAddress).encodeABI(), 'uint256']) // 8
    listMethods.push([tpLegacy.options.address, tpLegacy.methods.allowance(userAddress, tokenMigrator.options.address).encodeABI(), 'uint256']) // 9
  }

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])
  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call()
  const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))

  const userBalance = {}
  userBalance.blockHeight = multicallResult[0]
  userBalance.mocBalance = listReturnData[0]
  userBalance.mocAllowance = listReturnData[1]
  userBalance.docBalance = listReturnData[2]
  userBalance.bproBalance = listReturnData[3]
  userBalance.rbtcBalance = listReturnData[4]
  userBalance.docToRedeem = listReturnData[5]
  userBalance.bprox2Balance = listReturnData[6]
  userBalance.spendableBalance = listReturnData[4]
  userBalance.reserveAllowance = listReturnData[7]

  if (dContracts.contracts.tp_legacy) {
    userBalance.tpLegacyBalance = listReturnData[8]
    userBalance.tpLegacyAllowance = listReturnData[9]
  }

  userBalance.potentialBprox2MaxInterest = '0'
  userBalance.bProHoldIncentive = '0'
  userBalance.estimateGasMintBpro = '2000000'
  userBalance.estimateGasMintDoc = '2000000'
  userBalance.estimateGasMintBprox2 = '2000000'
  userBalance.userAddress = userAddress

  const calcMintInterest = await mocinrate.methods.calcMintInterestValues(BUCKET_X2, userBalance.rbtcBalance).call()

  userBalance.potentialBprox2MaxInterest = calcMintInterest

  return userBalance
}

const calcCommission = async (web3, dContracts, dataContractStatus, reserveAmount, token, action) => {
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  const multicall = dContracts.contracts.multicall
  const mocinrate = dContracts.contracts.mocinrate

  let mocType
  let reserveType
  switch (token) {
    case 'DOC':
      if (action === 'MINT') {
        reserveType = dataContractStatus.commissionRatesTypes.MINT_DOC_FEES_RBTC
        mocType = dataContractStatus.commissionRatesTypes.MINT_DOC_FEES_MOC
      } else {
        reserveType = dataContractStatus.commissionRatesTypes.REDEEM_DOC_FEES_RBTC
        mocType = dataContractStatus.commissionRatesTypes.REDEEM_DOC_FEES_MOC
      }
      break
    case 'BPRO':
      if (action === 'MINT') {
        reserveType = dataContractStatus.commissionRatesTypes.MINT_BPRO_FEES_RBTC
        mocType = dataContractStatus.commissionRatesTypes.MINT_BPRO_FEES_MOC
      } else {
        reserveType = dataContractStatus.commissionRatesTypes.REDEEM_BPRO_FEES_RBTC
        mocType = dataContractStatus.commissionRatesTypes.REDEEM_BPRO_FEES_MOC
      }
      break
    case 'BTCX':
      if (action === 'MINT') {
        reserveType = dataContractStatus.commissionRatesTypes.MINT_BTCX_FEES_RBTC
        mocType = dataContractStatus.commissionRatesTypes.MINT_BTCX_FEES_MOC
      } else {
        reserveType = dataContractStatus.commissionRatesTypes.REDEEM_BTCX_FEES_RBTC
        mocType = dataContractStatus.commissionRatesTypes.REDEEM_BTCX_FEES_MOC
      }
      break
    case 'STABLE':
      if (action === 'MINT') {
        reserveType = dataContractStatus.commissionRatesTypes.MINT_STABLETOKEN_FEES_RESERVE
        mocType = dataContractStatus.commissionRatesTypes.MINT_STABLETOKEN_FEES_MOC
      } else {
        reserveType = dataContractStatus.commissionRatesTypes.REDEEM_STABLETOKEN_FEES_RESERVE
        mocType = dataContractStatus.commissionRatesTypes.REDEEM_STABLETOKEN_FEES_MOC
      }
      break
    case 'RISKPRO':
      if (action === 'MINT') {
        reserveType = dataContractStatus.commissionRatesTypes.MINT_RISKPRO_FEES_RESERVE
        mocType = dataContractStatus.commissionRatesTypes.MINT_RISKPRO_FEES_MOC
      } else {
        reserveType = dataContractStatus.commissionRatesTypes.REDEEM_RISKPRO_FEES_RESERVE
        mocType = dataContractStatus.commissionRatesTypes.REDEEM_RISKPRO_FEES_MOC
      }
      break
    case 'RISKPROX':
      if (action === 'MINT') {
        reserveType = dataContractStatus.commissionRatesTypes.MINT_RISKPROX_FEES_RESERVE
        mocType = dataContractStatus.commissionRatesTypes.MINT_RISKPROX_FEES_MOC
      } else {
        reserveType = dataContractStatus.commissionRatesTypes.REDEEM_RISKPROX_FEES_RESERVE
        mocType = dataContractStatus.commissionRatesTypes.REDEEM_RISKPROX_FEES_MOC
      }
      break
  }

  // Calculate commission with multicall
  const listMethods = [
    [mocinrate.options.address, mocinrate.methods.calcCommissionValue(toContractPrecision(reserveAmount), reserveType).encodeABI(), 'uint256'], // 0
    [mocinrate.options.address, mocinrate.methods.calcCommissionValue(toContractPrecision(reserveAmount), mocType).encodeABI(), 'uint256'], // 1
    [mocinrate.options.address, mocinrate.methods.calculateVendorMarkup(vendorAddress, toContractPrecision(reserveAmount)).encodeABI(), 'uint256'] // 2
  ]

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])

  // Multicall results
  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call()

  // Decode multicall
  const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))

  // Dictionary commissions
  const commission = {}
  commission.commission_reserve = listReturnData[0]
  commission.commission_moc = listReturnData[1]
  commission.vendorMarkup = listReturnData[2]

  return commission
}

export {
  contractStatus,
  connectorAddresses,
  userBalance,
  calcCommission
}
