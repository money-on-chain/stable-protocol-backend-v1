/* eslint-disable no-undef */
const BigNumber = require('bignumber.js')

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })

const Web3 = require('web3')

const { readJsonFile, getAppMode, getAppMoCProject } = require('./utils')
const { contractStatus, connectorAddresses, registryAddresses, userBalance } = require('./multicall')
const { addABI } = require('./transaction')

require('dotenv').config()

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

  // Omoc Contracts
  const IRegistry = readJsonFile('./abis/omoc/IRegistry.json')
  dContracts.json.IRegistry = IRegistry

  const IStakingMachine = readJsonFile('./abis/omoc/IStakingMachine.json')
  dContracts.json.IStakingMachine = IStakingMachine

  const IDelayMachine = readJsonFile('./abis/omoc/IDelayMachine.json')
  dContracts.json.IDelayMachine = IDelayMachine

  const ISupporters = readJsonFile('./abis/omoc/ISupporters.json')
  dContracts.json.ISupporters = ISupporters

  const IVestingMachine = readJsonFile('./abis/omoc/IVestingMachine.json')
  dContracts.json.IVestingMachine = IVestingMachine

  const IVotingMachine = readJsonFile('./abis/omoc/IVotingMachine.json')
  dContracts.json.IVotingMachine = IVotingMachine

  console.log('Reading OMOC: IRegistry Contract... address: ', config.IRegistry)
  const iregistry = new web3.eth.Contract(IRegistry.abi, config.IRegistry)
  dContracts.contracts.iregistry = iregistry

  // Read contracts addresses from registry
  const [
    mocStakingMachineAddress,
    supportersAddress,
    delayMachineAddress,
    vestingMachineAddress,
    votingMachineAddress,
    priceProviderRegistryAddress,
    oracleManagerAddress
  ] = await registryAddresses(web3, dContracts)

  console.log('Reading OMOC: IStakingMachine Contract... address: ', mocStakingMachineAddress)
  const istakingmachine = new web3.eth.Contract(IStakingMachine.abi, mocStakingMachineAddress)
  dContracts.contracts.istakingmachine = istakingmachine

  console.log('Reading OMOC: IDelayMachine Contract... address: ', delayMachineAddress)
  const idelaymachine = new web3.eth.Contract(IDelayMachine.abi, delayMachineAddress)
  dContracts.contracts.idelaymachine = idelaymachine

  console.log('Reading OMOC: ISupporters Contract... address: ', supportersAddress)
  const isupporters = new web3.eth.Contract(ISupporters.abi, supportersAddress)
  dContracts.contracts.isupporters = isupporters

  console.log('Reading OMOC: IVestingMachine Contract... address: ', vestingMachineAddress)
  const ivestingmachine = new web3.eth.Contract(IVestingMachine.abi, vestingMachineAddress)
  dContracts.contracts.ivestingmachine = ivestingmachine

  console.log('Reading OMOC: IVotingMachine Contract... address: ', votingMachineAddress)
  const ivotingmachine = new web3.eth.Contract(IVotingMachine.abi, votingMachineAddress)
  dContracts.contracts.ivotingmachine = ivotingmachine

  // Add to abi decoder
  addABI(dContracts)

  return dContracts
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

module.exports = {
  connectorAddresses,
  contractStatus,
  userBalance,
  readContracts,
  renderUserBalance,
  renderContractStatus,
  getAppMode,
  statusFromContracts,
  userBalanceFromContracts
}
