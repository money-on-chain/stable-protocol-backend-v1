/* eslint-disable no-undef */
const BigNumber = require('bignumber.js')

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })

const abiDecoder = require('abi-decoder')
const Web3 = require('web3')

const { readJsonFile } = require('./utils')

require('dotenv').config()

const BUCKET_X2 = '0x5832000000000000000000000000000000000000000000000000000000000000'
const BUCKET_C0 = '0x4330000000000000000000000000000000000000000000000000000000000000'

const connectorAddresses = async (web3, dContracts) => {
  const multicall = dContracts.contracts.multicall
  const mocconnector = dContracts.contracts.mocconnector
  const appMode = getAppMode()

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

  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, listMethods).call()

  const listReturnData = multicallResult[2].map(x => web3.eth.abi.decodeParameter('address', x.returnData))

  return listReturnData
}

const readContracts = async (web3, config) => {
  const appProject = getAppMoCProject()
  const appMode = getAppMode()

  dContracts = {}
  dContracts.json = {}
  dContracts.contracts = {}
  dContracts.contractsAddresses = {}

  const Multicall2 = readJsonFile(`./abis/${appProject}/Multicall2.json`)
  dContracts.json.Multicall2 = Multicall2
  const MoCConnector = readJsonFile(`./abis/${appProject}/MoCConnector.json`)
  dContracts.json.MoCConnector = MoCConnector
  const MoC = readJsonFile(`./abis/${appProject}/MoC.json`)
  dContracts.json.MoC = MoC
  const MoCState = readJsonFile(`./abis/${appProject}/MoCState.json`)
  dContracts.json.MoCState = MoCState
  const MoCExchange = readJsonFile(`./abis/${appProject}/MoCExchange.json`)
  dContracts.json.MoCExchange = MoCExchange
  const MoCInrate = readJsonFile(`./abis/${appProject}/MoCInrate.json`)
  dContracts.json.MoCInrate = MoCInrate
  const MoCSettlement = readJsonFile(`./abis/${appProject}/MoCSettlement.json`)
  dContracts.json.MoCSettlement = MoCSettlement
  const DocToken = readJsonFile(`./abis/${appProject}/DocToken.json`)
  dContracts.json.DocToken = DocToken
  const BProToken = readJsonFile(`./abis/${appProject}/BProToken.json`)
  dContracts.json.BProToken = BProToken
  const MoCToken = readJsonFile(`./abis/${appProject}/MoCToken.json`)
  dContracts.json.MoCToken = MoCToken
  const ReserveToken = readJsonFile(`./abis/${appProject}/ReserveToken.json`)
  dContracts.json.ReserveToken = ReserveToken
  const MoCVendors = readJsonFile(`./abis/${appProject}/MoCVendors.json`)
  dContracts.json.MoCVendors = MoCVendors

  console.log('Reading Multicall2 Contract... address: ', config.Multicall2)
  const multicall = new web3.eth.Contract(Multicall2.abi, config.Multicall2)
  dContracts.contracts.multicall = multicall

  console.log('Reading MoC Contract... address: ', config.MoC)
  const moc = new web3.eth.Contract(MoC.abi, config.MoC)
  dContracts.contracts.moc = moc

  const connectorAddress = await moc.methods.connector().call()

  console.log('Reading MoCConnector... address: ', connectorAddress)
  const mocconnector = new web3.eth.Contract(MoCConnector.abi, connectorAddress)
  dContracts.contracts.mocconnector = mocconnector

  // Read contracts addresses from connector
  const [
    mocStateAddress,
    mocInrateAddress,
    mocExchangeAddress,
    mocSettlementAddress,
    stableTokenAddress,
    riskproTokenAddress,
    reserveTokenAddress
  ] = await connectorAddresses(web3, dContracts)

  console.log('Reading MoC State Contract... address: ', mocStateAddress)
  const mocstate = new web3.eth.Contract(MoCState.abi, mocStateAddress)
  dContracts.contracts.mocstate = mocstate

  console.log('Reading MoC Inrate Contract... address: ', mocInrateAddress)
  const mocinrate = new web3.eth.Contract(MoCInrate.abi, mocInrateAddress)
  dContracts.contracts.mocinrate = mocinrate

  console.log('Reading MoC Exchange Contract... address: ', mocExchangeAddress)
  const mocexchange = new web3.eth.Contract(MoCExchange.abi, mocExchangeAddress)
  dContracts.contracts.mocexchange = mocexchange

  console.log('Reading MoC Settlement  Contract... address: ', mocSettlementAddress)
  const mocsettlement = new web3.eth.Contract(MoCSettlement.abi, mocSettlementAddress)
  dContracts.contracts.mocsettlement = mocsettlement

  console.log('Reading STABLE Token Contract... address: ', stableTokenAddress)
  const doctoken = new web3.eth.Contract(DocToken.abi, stableTokenAddress)
  dContracts.contracts.doctoken = doctoken

  console.log('Reading RISKPRO Token Contract... address: ', riskproTokenAddress)
  const bprotoken = new web3.eth.Contract(BProToken.abi, riskproTokenAddress)
  dContracts.contracts.bprotoken = bprotoken

  if (appMode === 'RRC20') {
    console.log('Reading RESERVE Token Contract... address: ', reserveTokenAddress)
    const reservetoken = new web3.eth.Contract(ReserveToken.abi, reserveTokenAddress)
    dContracts.contracts.reservetoken = reservetoken
  }

  const mocTokenAddress = await mocstate.methods.getMoCToken().call()
  const mocVendorsAddress = await mocstate.methods.getMoCVendors().call()

  console.log('Reading MoC Token Contract... address: ', mocTokenAddress)
  const moctoken = new web3.eth.Contract(MoCToken.abi, mocTokenAddress)
  dContracts.contracts.moctoken = moctoken

  console.log('Reading MoC Vendors Contract... address: ', mocVendorsAddress)
  const mocvendors = new web3.eth.Contract(MoCVendors.abi, mocVendorsAddress)
  dContracts.contracts.mocvendors = mocvendors

  // Abi decoder
  abiDecoder.addABI(dContracts.json.MoC.abi)
  abiDecoder.addABI(dContracts.json.MoCState.abi)
  abiDecoder.addABI(dContracts.json.MoCExchange.abi)
  abiDecoder.addABI(dContracts.json.MoCInrate.abi)
  abiDecoder.addABI(dContracts.json.MoCSettlement.abi)
  abiDecoder.addABI(dContracts.json.DocToken.abi)
  abiDecoder.addABI(dContracts.json.BProToken.abi)
  abiDecoder.addABI(dContracts.json.MoCToken.abi)
  abiDecoder.addABI(dContracts.json.MoCVendors.abi)
  if (appMode === 'RRC20') {
    abiDecoder.addABI(dContracts.json.ReserveToken.abi)
  }

  return dContracts
}

const getAppMode = () => {
  const mocEnvironment = `${process.env.MOC_ENVIRONMENT}`

  let appMode
  switch (mocEnvironment) {
    case 'mocTestnetAlpha':
    case 'mocTestnet':
    case 'mocMainnet2':
      appMode = 'MoC'
      break
    case 'rdocTestnetAlpha':
    case 'rdocTestnet':
    case 'rdocMainnet':
      appMode = 'RRC20'
      break
    default:
      throw new Error('Environment not implemented! Please refer to table list of MoC Environments')
  }
  return appMode
}

const getAppMoCProject = () => {
  const mocEnvironment = `${process.env.MOC_ENVIRONMENT}`

  let appProject
  switch (mocEnvironment) {
    case 'mocTestnetAlpha':
    case 'mocTestnet':
    case 'mocMainnet2':
      appProject = 'MoC'
      break
    case 'rdocTestnetAlpha':
    case 'rdocTestnet':
    case 'rdocMainnet':
      appProject = 'RDoC'
      break
    default:
      throw new Error('Environment not implemented! Please refer to table list of MoC Environments')
  }
  return appProject
}

const contractStatus = async (web3, dContracts) => {
  const appMode = getAppMode()

  const multicall = dContracts.contracts.multicall
  const moc = dContracts.contracts.moc
  const mocstate = dContracts.contracts.mocstate
  const mocinrate = dContracts.contracts.mocinrate
  const mocsettlement = dContracts.contracts.mocsettlement

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
      [mocstate.options.address, mocstate.methods.getMoCVendors().encodeABI(), 'address'] // 52
    ]
  }

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])

  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call()

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

  const multicallResultRates = await multicall.methods.tryBlockAndAggregate(false, cleanListMethodsRates).call()

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

  return dMocState
}

const renderContractStatus = (contracStatus, config) => {
  const render = `
${config.tokens.RESERVE.name} Price: ${Web3.utils.fromWei(contracStatus.bitcoinPrice)} USD
${config.tokens.RESERVE.name} EMA Price: ${Web3.utils.fromWei(contracStatus.bitcoinMovingAverage)} USD
${config.tokens.MOC.name} Price: ${Web3.utils.fromWei(contracStatus.mocPrice)} USD
${config.tokens.RISKPRO.name} Available to redeem: ${Web3.utils.fromWei(contracStatus.bproAvailableToRedeem)} ${config.tokens.RISKPRO.name}
${config.tokens.RISKPROX.name} Available to mint: ${Web3.utils.fromWei(contracStatus.bprox2AvailableToMint)} ${config.tokens.RISKPROX.name}
${config.tokens.STABLE.name} Available to mint: ${Web3.utils.fromWei(contracStatus.docAvailableToMint)} ${config.tokens.STABLE.name}
${config.tokens.STABLE.name} Available to redeem: ${Web3.utils.fromWei(contracStatus.docAvailableToRedeem)} ${config.tokens.STABLE.name}
${config.tokens.RISKPRO.name} Leverage: ${Web3.utils.fromWei(contracStatus.b0Leverage)} 
${config.tokens.RISKPRO.name} Target Coverage: ${Web3.utils.fromWei(contracStatus.b0Leverage)} 
Total ${config.tokens.RESERVE.name} in contract: ${Web3.utils.fromWei(contracStatus.totalBTCAmount)} 
Total ${config.tokens.RESERVE.name} inrate Bag: ${Web3.utils.fromWei(contracStatus.b0BTCInrateBag)} 
Global Coverage: ${Web3.utils.fromWei(contracStatus.globalCoverage)} 
${config.tokens.RISKPROX.name} Coverage: ${Web3.utils.fromWei(contracStatus.x2Coverage)} 
${config.tokens.RISKPROX.name} Leverage: ${Web3.utils.fromWei(contracStatus.x2Leverage)} 
${config.tokens.RISKPRO.name} Price: ${Web3.utils.fromWei(contracStatus.bproPriceInUsd)} USD
${config.tokens.RISKPROX.name} Price: ${Web3.utils.fromWei(contracStatus.bprox2PriceInRbtc)} ${config.tokens.RESERVE.name}
Contract State: ${contracStatus.state} 
Contract Paused: ${contracStatus.paused} 
Contract Protected: ${contracStatus.protected} 
    `

  return render
}

const userBalance = async (web3, dContracts, userAddress) => {
  const appMode = getAppMode()

  const multicall = dContracts.contracts.multicall
  const moc = dContracts.contracts.moc
  const mocinrate = dContracts.contracts.mocinrate
  const moctoken = dContracts.contracts.moctoken
  const bprotoken = dContracts.contracts.bprotoken
  const doctoken = dContracts.contracts.doctoken

  console.log(`Reading user balance ... account: ${userAddress}`)

  const listMethods = [
    [moctoken.options.address, moctoken.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 0
    [moctoken.options.address, moctoken.methods.allowance(userAddress, moc.options.address).encodeABI(), 'uint256'], // 1
    [doctoken.options.address, doctoken.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 2
    [bprotoken.options.address, bprotoken.methods.balanceOf(userAddress).encodeABI(), 'uint256'] // 3
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

const renderUserBalance = (userBalance, config) => {
  const render = `
User: ${userBalance.userAddress}
${config.tokens.RESERVE.name} Balance: ${Web3.utils.fromWei(userBalance.rbtcBalance)} ${config.tokens.RESERVE.name}
${config.tokens.STABLE.name} Balance: ${Web3.utils.fromWei(userBalance.docBalance)} ${config.tokens.STABLE.name}
${config.tokens.RISKPRO.name} Balance: ${Web3.utils.fromWei(userBalance.bproBalance)} ${config.tokens.RISKPRO.name}
${config.tokens.RISKPROX.name} Balance: ${Web3.utils.fromWei(userBalance.bprox2Balance)} ${config.tokens.RISKPROX.name}
${config.tokens.MOC.name} Balance: ${Web3.utils.fromWei(userBalance.mocBalance)} ${config.tokens.MOC.name}
${config.tokens.MOC.name} Allowance: ${Web3.utils.fromWei(userBalance.mocAllowance)} ${config.tokens.MOC.name}
${config.tokens.STABLE.name} queue to redeem: ${Web3.utils.fromWei(userBalance.docToRedeem)} ${config.tokens.STABLE.name}
    `

  return render
}

const toContractPrecision = (amount) => {
  return Web3.utils.toWei(amount.toFormat(18, BigNumber.ROUND_DOWN), 'ether')
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
  commission = {}
  commission.commission_reserve = listReturnData[0]
  commission.commission_moc = listReturnData[1]
  commission.vendorMarkup = listReturnData[2]

  return commission
}

const addCommissions = async (web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, token, action) => {
  // get reserve price from contract
  const reservePrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.bitcoinPrice))

  // Get commissions from contracts
  const commissions = await calcCommission(web3, dContracts, dataContractStatus, reserveAmount, token, action)

  // Calculate commissions using Reserve payment
  const commissionInReserve = new BigNumber(Web3.utils.fromWei(commissions.commission_reserve))
    .plus(new BigNumber(Web3.utils.fromWei(commissions.vendorMarkup)))

  // Calculate commissions using MoC Token payment
  const commissionInMoc = new BigNumber(Web3.utils.fromWei(commissions.commission_moc))
    .plus(new BigNumber(Web3.utils.fromWei(commissions.vendorMarkup)))
    .times(reservePrice).div(Web3.utils.fromWei(dataContractStatus.mocPrice))

  // Enough MoC to Pay commission with MoC Token
  const enoughMOCBalance = BigNumber(Web3.utils.fromWei(userBalanceStats.mocBalance)).gte(commissionInMoc)

  // Enough MoC allowance to Pay commission with MoC Token
  const enoughMOCAllowance = BigNumber(Web3.utils.fromWei(userBalanceStats.mocAllowance)).gt(0) &&
    BigNumber(Web3.utils.fromWei(userBalanceStats.mocAllowance)).gte(commissionInMoc)

  // add commission to value send
  let valueToSend

  if (enoughMOCBalance && enoughMOCAllowance) {
    valueToSend = reserveAmount
    console.log(`Paying commission with MoC Tokens: ${commissionInMoc} MOC`)
  } else {
    valueToSend = reserveAmount.plus(commissionInReserve)
    console.log(`Paying commission with RBTC: ${commissionInReserve} RBTC`)
  }

  return valueToSend
}

const renderEventField = (eveName, eveValue) => {
  const formatItemsWei = new Set([
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
    'leverage',
    'value',
    'paidMoC',
    'paidReserveToken',
    'paidRBTC'])

  if (formatItemsWei.has(eveName)) { eveValue = Web3.utils.fromWei(eveValue) }

  console.log('\x1b[32m%s\x1b[0m', `${eveName}: ${eveValue}`)
}

const renderEvent = (evente) => {
  console.log('')
  console.log('\x1b[35m%s\x1b[0m', `Event: ${evente.name}`)
  console.log('')
  evente.events.forEach(eve => renderEventField(eve.name, eve.value))
}

const decodeEvents = (receipt) => {
  const decodedLogs = abiDecoder.decodeLogs(receipt.logs)

  const filterIncludes = [
    'StableTokenMint',
    'StableTokenRedeem',
    'FreeStableTokenRedeem',
    'RiskProWithDiscountMint',
    'RiskProMint',
    'RiskProRedeem',
    'RiskProxMint',
    'RiskProxRedeem',
    'Transfer',
    'Approval',
    'VendorReceivedMarkup'
  ]

  const filteredEvents = decodedLogs.filter(event =>
    filterIncludes.includes(event.name)
  )

  filteredEvents.forEach(evente => renderEvent(evente))

  return filteredEvents
}

const sendTransaction = async (web3, value, estimateGas, encodedCall, toContract) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const privateKey = process.env.USER_PK
  const gasMultiplier = process.env.GAS_MULTIPLIER

  console.log('Please wait... sending transaction... Wait until blockchain mine transaction!')

  let valueToSend
  if ((typeof value === 'undefined') || value === null) {
    valueToSend = '0x'
  } else {
    valueToSend = toContractPrecision(value)
  }

  // Get gas price from node
  const gasPrice = await web3.eth.getGasPrice()

  // Sign transaction need it PK
  const transaction = await web3.eth.accounts.signTransaction(
    {
      from: userAddress,
      to: toContract,
      value: valueToSend,
      gas: estimateGas * gasMultiplier,
      gasPrice,
      gasLimit: estimateGas * gasMultiplier,
      data: encodedCall
    },
    privateKey
  )

  // Send transaction and get recipt
  const receipt = await web3.eth.sendSignedTransaction(
    transaction.rawTransaction
  )

  // Print decode events
  const filteredEvents = decodeEvents(receipt)

  return { receipt, filteredEvents }
}

const statusFromContracts = async (web3, dContracts, config) => {
  // Read current status info from different contract MoCState.sol MoCInrate.sol
  // MoCSettlement.sol MoC.sol in one call throught Multicall
  const dataContractStatus = await contractStatus(web3, dContracts)

  console.log('\x1b[35m%s\x1b[0m', 'Contract Status')
  console.log()
  console.log('\x1b[32m%s\x1b[0m', renderContractStatus(dataContractStatus, config))

  return dataContractStatus
}

const userBalanceFromContracts = async (web3, dContracts, config, userAddress) => {
  // Get user token and allowances balance
  const userBalanceStats = await userBalance(web3, dContracts, userAddress)
  console.log()
  console.log('\x1b[32m%s\x1b[0m', renderUserBalance(userBalanceStats, config))

  return userBalanceStats
}

const AllowPayingCommissionMoC = async (web3, dContracts, allow) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const moctoken = dContracts.contracts.moctoken

  let amountAllowance = '0'
  const valueToSend = null
  if (allow) {
    amountAllowance = Number.MAX_SAFE_INTEGER.toString()
  }

  // Calculate estimate gas cost
  const estimateGas = await moctoken.methods
    .approve(dContracts.contracts.moc._address, web3.utils.toWei(amountAllowance))
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moctoken.methods
    .approve(dContracts.contracts.moc._address, web3.utils.toWei(amountAllowance))
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, moctoken._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const AllowanceUseReserveToken = async (web3, dContracts, allow) => {
  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const reservetoken = dContracts.contracts.reservetoken

  let amountAllowance = '0'
  const valueToSend = null
  if (allow) {
    amountAllowance = Number.MAX_SAFE_INTEGER.toString()
  }

  // Calculate estimate gas cost
  const estimateGas = await reservetoken.methods
    .approve(dContracts.contracts.moc._address, web3.utils.toWei(amountAllowance))
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = reservetoken.methods
    .approve(dContracts.contracts.moc._address, web3.utils.toWei(amountAllowance))
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, reservetoken._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const AdminVendorInfo = async (web3, dContracts, vendorAddress) => {
  const mocvendors = dContracts.contracts.mocvendors

  const vendor = await mocvendors.methods.vendors(vendorAddress).call()

  console.log('\x1b[35m%s\x1b[0m', `Vendor Account: ${vendorAddress}`)
  console.log('\x1b[32m%s\x1b[0m', `Is Active: ${vendor.isActive}`)
  console.log('\x1b[35m%s\x1b[0m', `Markup: ${Web3.utils.fromWei(vendor.markup)}`)
  console.log('\x1b[32m%s\x1b[0m', `Total Paid in MoC: ${Web3.utils.fromWei(vendor.totalPaidInMoC)}`)
  console.log('\x1b[35m%s\x1b[0m', `Staking: ${Web3.utils.fromWei(vendor.staking)}`)
}

const calcMintInterest = async (dContracts, amount) => {
  const mocinrate = dContracts.contracts.mocinrate
  const calcMintInterest = await mocinrate.methods.calcMintInterestValues(BUCKET_X2, toContractPrecision(amount)).call()
  return calcMintInterest
}

const mintStable = async (web3, dContracts, config, stableAmount) => {
  // Mint stable token with collateral coin base

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const mintSlippage = `${process.env.MINT_SLIPPAGE}`

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'MoC') throw new Error('This function is only for app mode = MoC')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // get bitcoin price from contract
  const bitcoinPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.bitcoinPrice))

  // Stable amount in reserve
  const reserveAmount = new BigNumber(stableAmount).div(bitcoinPrice)

  let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'DOC', 'MINT')

  // Add Slippage plus %
  const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount)

  console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`)

  // Verifications

  // User have suficient reserve to pay?
  console.log(`To mint ${stableAmount} ${config.tokens.STABLE.name} you need > ${valueToSend.toString()} ${config.tokens.RESERVE.name} in your balance`)
  const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.rbtcBalance))
  if (valueToSend.gt(userReserveBalance)) throw new Error('Insuficient reserve balance')

  // There are suficient STABLE in the contracts to mint?
  const stableAvalaiblesToMint = new BigNumber(Web3.utils.fromWei(dataContractStatus.docAvailableToMint))
  if (new BigNumber(stableAmount).gt(stableAvalaiblesToMint)) throw new Error(`Insuficient ${config.tokens.STABLE.name} avalaibles to mint`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .mintDocVendors(toContractPrecision(reserveAmount), vendorAddress)
    .estimateGas({ from: userAddress, value: toContractPrecision(valueToSend) })

  // encode function
  const encodedCall = moc.methods
    .mintDocVendors(toContractPrecision(reserveAmount), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const redeemStable = async (web3, dContracts, config, stableAmount) => {
  // Redeem stable token receiving coin base

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'MoC') throw new Error('This function is only for app mode = MoC')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // get bitcoin price from contract
  const bitcoinPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.bitcoinPrice))

  // Stable amount in reserve
  const reserveAmount = new BigNumber(stableAmount).div(bitcoinPrice)

  // Redeem function... no values sent
  const valueToSend = null

  // Verifications

  // User have suficient STABLE in balance?
  console.log(`Redeeming ${stableAmount} ${config.tokens.STABLE.name} ... getting aprox: ${reserveAmount} ${config.tokens.RESERVE.name}... `)
  const userStableBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.docBalance))
  if (new BigNumber(stableAmount).gt(userStableBalance)) throw new Error('Insuficient STABLE user balance')

  // There are suficient Free Stable in the contracts to redeem?
  const stableAvalaiblesToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.docAvailableToRedeem))
  if (new BigNumber(stableAmount).gt(stableAvalaiblesToRedeem)) throw new Error(`Insuficient ${config.tokens.RESERVE.name} avalaibles to redeem in contract`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .redeemFreeDocVendors(toContractPrecision(new BigNumber(stableAmount)), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .redeemFreeDocVendors(toContractPrecision(new BigNumber(stableAmount)), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const mintRiskpro = async (web3, dContracts, config, riskproAmount) => {
  // Mint RiskPro token with collateral coin base

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const mintSlippage = `${process.env.MINT_SLIPPAGE}`

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'MoC') throw new Error('This function is only for app mode = MoC')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // Price of RISKPRO in RESERVE
  const riskproPriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.bproPriceInRbtc))

  // RISKPRO amount in reserve
  const reserveAmount = new BigNumber(riskproAmount).times(riskproPriceInReserve)

  let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'BPRO', 'MINT')

  // Add Slippage plus %
  const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount)

  console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`)

  // Verifications

  // User have suficient reserve to pay?
  console.log(`To mint ${riskproAmount} ${config.tokens.RISKPRO.name} you need > ${valueToSend.toString()} ${config.tokens.RESERVE.name} in your balance`)
  const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.rbtcBalance))
  if (valueToSend.gt(userReserveBalance)) throw new Error('Insuficient reserve balance')

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .mintBProVendors(toContractPrecision(reserveAmount), vendorAddress)
    .estimateGas({ from: userAddress, value: toContractPrecision(valueToSend) })

  // encode function
  const encodedCall = moc.methods
    .mintBProVendors(toContractPrecision(reserveAmount), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const redeemRiskpro = async (web3, dContracts, config, riskproAmount) => {
  // Redeem RISKPRO token receiving coin base

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'MoC') throw new Error('This function is only for MoC Mode... are you using in your enviroment RIF projects?')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // Price of RISKPRO in RESERVE
  const riskproPriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.bproPriceInRbtc))

  // RISKPRO amount in reserve
  const reserveAmount = new BigNumber(riskproAmount).times(riskproPriceInReserve)

  // Redeem function... no values sent
  const valueToSend = null

  // Verifications

  // User have suficient RISKPRO in balance?
  console.log(`Redeeming ${riskproAmount} ${config.tokens.RISKPRO.name} ... getting aprox: ${reserveAmount} ${config.tokens.RESERVE.name}... `)
  const userRiskproBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.bproBalance))
  if (new BigNumber(riskproAmount).gt(userRiskproBalance)) throw new Error(`Insuficient ${config.tokens.RISKPRO.name} user balance`)

  // There are suficient RISKPRO in the contracts to redeem?
  const riskproAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.bproAvailableToRedeem))
  if (new BigNumber(riskproAmount).gt(riskproAvailableToRedeem)) throw new Error(`Insuficient ${config.tokens.RISKPRO.name} avalaibles to redeem in contract`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .redeemBProVendors(toContractPrecision(new BigNumber(riskproAmount)), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .redeemBProVendors(toContractPrecision(new BigNumber(riskproAmount)), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const mintRiskprox = async (web3, dContracts, config, riskproxAmount) => {
  // Mint RiskproX token with collateral coin base

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const mintSlippage = `${process.env.MINT_SLIPPAGE}`

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'MoC') throw new Error('This function is only for app mode = MoC')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // Price of Riskprox in coinbase
  const bprox2PriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.bprox2PriceInRbtc))

  // RISKPROx amount in reserve
  const reserveAmount = new BigNumber(riskproxAmount).times(bprox2PriceInReserve)

  let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'BTCX', 'MINT')

  // Calc Interest to mint RISKPROX
  const mintInterest = await calcMintInterest(dContracts, reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(new BigNumber(Web3.utils.fromWei(mintInterest)))

  console.log(`Mint RISKPROX Interest ${mintInterest}`)

  // Add Slippage plus %
  const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount)

  console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`)

  // Verifications

  // User have suficient reserve to pay?
  console.log(`To mint ${riskproxAmount} ${config.tokens.RISKPROX.name} you need > ${valueToSend.toString()} ${config.tokens.RESERVE.name} in your balance`)
  const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.rbtcBalance))
  if (valueToSend.gt(userReserveBalance)) throw new Error('Insuficient reserve balance')

  // There are suficient RISKPROX in the contracts to mint?
  const riskproxAvalaiblesToMint = new BigNumber(Web3.utils.fromWei(dataContractStatus.bprox2AvailableToMint))
  if (new BigNumber(riskproxAmount).gt(riskproxAvalaiblesToMint)) throw new Error(`Insuficient ${config.tokens.RISKPROX.name} avalaibles to mint`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .mintBProxVendors(BUCKET_X2, toContractPrecision(reserveAmount), vendorAddress)
    .estimateGas({ from: userAddress, value: toContractPrecision(valueToSend) })

  // encode function
  const encodedCall = moc.methods
    .mintBProxVendors(BUCKET_X2, toContractPrecision(reserveAmount), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const redeemRiskprox = async (web3, dContracts, config, riskproxAmount) => {
  // Redeem RISKPROx token receiving coin base

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'MoC') throw new Error('This function is only for app mode = MoC')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // Price of RISKPROx in RESERVE
  const riskproxPriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.bprox2PriceInRbtc))

  // RISKPROx amount in reserve RESERVE
  const reserveAmount = new BigNumber(riskproxAmount).times(riskproxPriceInReserve)

  // Redeem function... no values sent
  const valueToSend = null

  // Verifications

  // User have suficient RISKPROx in balance?
  console.log(`Redeeming ${riskproxAmount} ${config.tokens.RISKPROX.name} ... getting aprox: ${reserveAmount} ${config.tokens.RESERVE.name}... `)
  const userRiskproxBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.bprox2Balance))
  if (new BigNumber(riskproxAmount).gt(userRiskproxBalance)) throw new Error(`Insuficient ${config.tokens.RISKPROX.name} user balance`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .redeemBProxVendors(BUCKET_X2, toContractPrecision(new BigNumber(riskproxAmount)), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .redeemBProxVendors(BUCKET_X2, toContractPrecision(new BigNumber(riskproxAmount)), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const mintStableRRC20 = async (web3, dContracts, config, stableAmount) => {
  // Mint stable token with collateral RRC20

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const mintSlippage = `${process.env.MINT_SLIPPAGE}`

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // get bitcoin price from contract
  const bitcoinPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.bitcoinPrice))

  // Stable amount in reserve
  const reserveAmount = new BigNumber(stableAmount).div(bitcoinPrice)

  let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'STABLE', 'MINT')

  // Add Slippage plus %
  const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount)

  console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`)

  // Verifications

  // User have suficient reserve to pay?
  console.log(`To mint ${stableAmount} ${config.tokens.STABLE.name} you need > ${valueToSend.toString()} ${config.tokens.RESERVE.name} in your balance`)
  const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.rbtcBalance))
  if (valueToSend.gt(userReserveBalance)) throw new Error('Insuficient reserve balance')

  // Allowance    reserveAllowance
  console.log(`Allowance: To mint ${stableAmount} ${config.tokens.STABLE.name} you need > ${valueToSend.toString()} ${config.tokens.RESERVE.name} in your spendable balance`)
  const userSpendableBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.reserveAllowance))
  if (valueToSend.gt(userSpendableBalance)) throw new Error('Insuficient spendable balance... please make an allowance to the MoC contract')

  // There are suficient STABLE in the contracts to mint?
  const stableAvalaiblesToMint = new BigNumber(Web3.utils.fromWei(dataContractStatus.docAvailableToMint))
  if (new BigNumber(stableAmount).gt(stableAvalaiblesToMint)) throw new Error(`Insuficient ${config.tokens.STABLE.name} avalaibles to mint`)

  // Mint STABLE RRC20 function... no values sent
  valueToSend = null

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .mintStableTokenVendors(toContractPrecision(reserveAmount), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .mintStableTokenVendors(toContractPrecision(reserveAmount), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const redeemStableRRC20 = async (web3, dContracts, config, stableAmount) => {
  // Redeem stable token receiving coin base

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // get bitcoin price from contract
  const bitcoinPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.bitcoinPrice))

  // Stable amount in reserve
  const reserveAmount = new BigNumber(stableAmount).div(bitcoinPrice)

  // Redeem function... no values sent
  const valueToSend = null

  // Verifications

  // User have suficient STABLE in balance?
  console.log(`Redeeming ${stableAmount} ${config.tokens.STABLE.name} ... getting aprox: ${reserveAmount} ${config.tokens.RESERVE.name}... `)
  const userStableBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.docBalance))
  if (new BigNumber(stableAmount).gt(userStableBalance)) throw new Error(`Insuficient ${config.tokens.STABLE.name}  user balance`)

  // There are suficient Free Stable in the contracts to redeem?
  const stableAvalaiblesToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.docAvailableToRedeem))
  if (new BigNumber(stableAmount).gt(stableAvalaiblesToRedeem)) throw new Error(`Insuficient ${config.tokens.STABLE.name}  avalaibles to redeem in contract`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .redeemFreeStableTokenVendors(toContractPrecision(new BigNumber(stableAmount)), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .redeemFreeStableTokenVendors(toContractPrecision(new BigNumber(stableAmount)), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const mintRiskproRRC20 = async (web3, dContracts, config, riskproAmount) => {
  // Mint RiskPro token with collateral RRC20

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const mintSlippage = `${process.env.MINT_SLIPPAGE}`

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // Price of RISKPRO in RESERVE
  const bproPriceInRbtc = new BigNumber(Web3.utils.fromWei(dataContractStatus.bproPriceInRbtc))

  // RISKPRO amount in reserve
  const reserveAmount = new BigNumber(riskproAmount).times(bproPriceInRbtc)

  let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'RISKPRO', 'MINT')

  // Add Slippage plus %

  const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount)

  console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`)

  // Verifications

  // User have suficient reserve to pay?
  console.log(`To mint ${riskproAmount} ${config.tokens.RISKPRO.name} you need > ${valueToSend.toString()} ${config.tokens.RESERVE.name} in your balance`)
  const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.rbtcBalance))
  if (valueToSend.gt(userReserveBalance)) throw new Error('Insuficient reserve balance')

  // Allowance    reserveAllowance
  console.log(`Allowance: To mint ${riskproAmount} ${config.tokens.RISKPRO.name} you need > ${valueToSend.toString()} ${config.tokens.RESERVE.name} in your spendable balance`)
  const userSpendableBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.reserveAllowance))
  if (valueToSend.gt(userSpendableBalance)) throw new Error('Insuficient spendable balance... please make an allowance to the MoC contract')

  valueToSend = null
  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .mintRiskProVendors(toContractPrecision(reserveAmount), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .mintRiskProVendors(toContractPrecision(reserveAmount), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const redeemRiskproRRC20 = async (web3, dContracts, config, riskproAmount) => {
  // Redeem Riskpro token receiving RRC20

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'RRC20') throw new Error('This function is only for RRC20 Mode... are you using in your enviroment MOC projects?')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // Price of RISKPRO in RESERVE
  const riskproPriceInRbtc = new BigNumber(Web3.utils.fromWei(dataContractStatus.bproPriceInRbtc))

  // RISKPRO amount in reserve
  const reserveAmount = new BigNumber(riskproAmount).times(riskproPriceInRbtc)

  // Redeem function... no values sent
  const valueToSend = null

  // Verifications

  // User have suficient RISKPRO in balance?
  console.log(`Redeeming ${riskproAmount} ${config.tokens.RISKPRO.name} ... getting aprox: ${reserveAmount} ${config.tokens.RESERVE.name}... `)
  const userRiskproBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.bproBalance))
  if (new BigNumber(riskproAmount).gt(userRiskproBalance)) throw new Error(`Insuficient ${config.tokens.RISKPRO.name} user balance`)

  // There are suficient RISKPRO in the contracts to redeem?
  const riskproAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.bproAvailableToRedeem))
  if (new BigNumber(riskproAmount).gt(riskproAvailableToRedeem)) throw new Error(`Insuficient ${config.tokens.RISKPRO.name} avalaibles to redeem in contract`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .redeemRiskProVendors(toContractPrecision(new BigNumber(riskproAmount)), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .redeemRiskProVendors(toContractPrecision(new BigNumber(riskproAmount)), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const mintRiskproxRRC20 = async (web3, dContracts, config, riskproxAmount) => {
  // Mint RiskproX token with collateral RRC20

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const mintSlippage = `${process.env.MINT_SLIPPAGE}`

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // Price of Riskprox in coinbase
  const bprox2PriceInRbtc = new BigNumber(Web3.utils.fromWei(dataContractStatus.bprox2PriceInRbtc))

  // RISKPROx amount in reserve
  const reserveAmount = new BigNumber(riskproxAmount).times(bprox2PriceInRbtc)

  let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'RISKPROX', 'MINT')

  // Calc Interest to mint RISKPROx
  const mintInterest = await calcMintInterest(dContracts, reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(new BigNumber(Web3.utils.fromWei(mintInterest)))

  console.log(`Mint RISKPROx Interest ${mintInterest}`)

  // Add Slippage plus %
  const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount)

  console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`)

  // Verifications

  // User have suficient reserve to pay?
  console.log(`To mint ${riskproxAmount}  ${config.tokens.RISKPROX.name} you need > ${valueToSend.toString()} ${config.tokens.RESERVE.name} in your balance`)
  const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.rbtcBalance))
  if (valueToSend.gt(userReserveBalance)) throw new Error('Insuficient reserve balance')

  // There are suficient RISKPROX in the contracts to mint?
  const riskproxAvalaiblesToMint = new BigNumber(Web3.utils.fromWei(dataContractStatus.bprox2AvailableToMint))
  if (new BigNumber(riskproxAmount).gt(riskproxAvalaiblesToMint)) throw new Error(`Insuficient ${config.tokens.RISKPROX.name} avalaibles to mint`)

  valueToSend = null
  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .mintRiskProxVendors(BUCKET_X2, toContractPrecision(reserveAmount), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .mintRiskProxVendors(BUCKET_X2, toContractPrecision(reserveAmount), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const redeemRiskproxRRC20 = async (web3, dContracts, config, riskproxAmount) => {
  // Redeem Riskprox token receiving RRC20

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  // Ensure is in correct app mode
  const appMode = getAppMode()
  if (appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, config, userAddress)

  // Price of Riskprox in RESERVE
  const riskproxPriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.bprox2PriceInRbtc))

  // Riskprox amount in reserve RESERVE
  const reserveAmount = new BigNumber(riskproxAmount).times(riskproxPriceInReserve)

  // Redeem function... no values sent
  const valueToSend = null

  // Verifications

  // User have suficient RISKPROx in balance?
  console.log(`Redeeming ${riskproxAmount} ${config.tokens.RISKPROX.name}  ... getting aprox: ${reserveAmount} ${config.tokens.RESERVE.name} ... `)
  const userRiskproxBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.bprox2Balance))
  if (new BigNumber(riskproxAmount).gt(userRiskproxBalance)) throw new Error(`Insuficient ${config.tokens.RISKPROX.name}  user balance`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .redeemRiskProxVendors(BUCKET_X2, toContractPrecision(new BigNumber(riskproxAmount)), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .redeemRiskProxVendors(BUCKET_X2, toContractPrecision(new BigNumber(riskproxAmount)), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

module.exports = {
  connectorAddresses,
  contractStatus,
  userBalance,
  readContracts,
  renderUserBalance,
  renderContractStatus,
  AllowPayingCommissionMoC,
  AllowanceUseReserveToken,
  getAppMode,
  AdminVendorInfo,
  mintStable,
  redeemStable,
  mintRiskpro,
  redeemRiskpro,
  mintRiskprox,
  redeemRiskprox,
  mintStableRRC20,
  redeemStableRRC20,
  mintRiskproRRC20,
  redeemRiskproRRC20,
  mintRiskproxRRC20,
  redeemRiskproxRRC20
}
