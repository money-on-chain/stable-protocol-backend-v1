import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import * as dotenv from 'dotenv'

import { readJsonFile } from '../utils.js'
import { addABI } from '../transaction.js'

import { contractStatus, connectorAddresses, userBalance } from './multicall.js'

dotenv.config()

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })

const readContracts = async (web3, configProject) => {
  const appProject = configProject.appProject
  const appMode = configProject.appMode

  const dContracts = {}
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
  const TP = readJsonFile(`./abis/${appProject}/DocToken.json`)
  dContracts.json.TP = TP
  const TC = readJsonFile(`./abis/${appProject}/BProToken.json`)
  dContracts.json.TC = TC
  const TG = readJsonFile(`./abis/${appProject}/MoCToken.json`)
  dContracts.json.TG = TG
  const ReserveToken = readJsonFile(`./abis/${appProject}/ReserveToken.json`)
  dContracts.json.ReserveToken = ReserveToken
  const MoCVendors = readJsonFile(`./abis/${appProject}/MoCVendors.json`)
  dContracts.json.MoCVendors = MoCVendors

  console.log('Reading Multicall2 Contract... address: ', process.env.CONTRACT_MULTICALL2)
  const multicall = new web3.eth.Contract(Multicall2.abi, process.env.CONTRACT_MULTICALL2)
  dContracts.contracts.multicall = multicall

  console.log('Reading MoC Contract... address: ', process.env.CONTRACT_MOC)
  const moc = new web3.eth.Contract(MoC.abi, process.env.CONTRACT_MOC)
  dContracts.contracts.moc = moc

  const blockNumber = 6400000
  const connectorAddress = await moc.methods.connector().call({}, blockNumber)

  console.log('Reading MoCConnector... address: ', connectorAddress)
  const mocconnector = new web3.eth.Contract(MoCConnector.abi, connectorAddress)
  dContracts.contracts.mocconnector = mocconnector

  // Read contracts addresses from connector
  const [
    mocStateAddress,
    mocInrateAddress,
    mocExchangeAddress,
    mocSettlementAddress,
    tpAddress,
    tcAddress,
    reserveTokenAddress
  ] = await connectorAddresses(web3, dContracts, configProject)

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

  console.log(`Reading ${configProject.tokens.TP.name} Token Contract... address: `, tpAddress)
  const tp = new web3.eth.Contract(TP.abi, tpAddress)
  dContracts.contracts.tp = tp

  console.log(`Reading ${configProject.tokens.TC.name} Token Contract... address: `, tcAddress)
  const tc = new web3.eth.Contract(TC.abi, tcAddress)
  dContracts.contracts.tc = tc

  if (appMode === 'RRC20') {
    console.log(`Reading ${configProject.tokens.RESERVE.name} Token Contract... address: `, reserveTokenAddress)
    const reservetoken = new web3.eth.Contract(ReserveToken.abi, reserveTokenAddress)
    dContracts.contracts.reservetoken = reservetoken
  }

  const tgAddress = await mocstate.methods.getMoCToken().call({}, blockNumber)
  const mocVendorsAddress = await mocstate.methods.getMoCVendors().call({}, blockNumber)

  // Read govern Token
  console.log(`Reading ${configProject.tokens.TG.name} Token Contract... address: `, tgAddress)
  const tg = new web3.eth.Contract(TG.abi, tgAddress)
  dContracts.contracts.tg = tg

  console.log('Reading MoC Vendors Contract... address: ', mocVendorsAddress)
  const mocvendors = new web3.eth.Contract(MoCVendors.abi, mocVendorsAddress)
  dContracts.contracts.mocvendors = mocvendors

  // Token migrator & Legacy token
  if (process.env.CONTRACT_LEGACY_TP) {

    const TokenMigrator = readJsonFile(`./abis/${appProject}/TokenMigrator.json`)
    dContracts.json.TokenMigrator = TokenMigrator

    const tpLegacy = new web3.eth.Contract(TP.abi, process.env.CONTRACT_LEGACY_TP)
    dContracts.contracts.tp_legacy = tpLegacy

    if (!process.env.CONTRACT_TOKEN_MIGRATOR) console.log("Error: Please set token migrator address!")

    const tokenMigrator = new web3.eth.Contract(TokenMigrator.abi, process.env.CONTRACT_TOKEN_MIGRATOR)
    dContracts.contracts.token_migrator = tokenMigrator
  }

  // Add to abi decoder
  addABI(dContracts, appMode)

  return dContracts
}

const renderContractStatus = (contracStatus, config) => {
  const render = `
${config.tokens.RESERVE.name} Price: ${Web3.utils.fromWei(contracStatus.bitcoinPrice)} USD
${config.tokens.RESERVE.name} EMA Price: ${Web3.utils.fromWei(contracStatus.bitcoinMovingAverage)} USD
${config.tokens.TG.name} Price: ${Web3.utils.fromWei(contracStatus.mocPrice)} USD
${config.tokens.TC.name} Available to redeem: ${Web3.utils.fromWei(contracStatus.bproAvailableToRedeem)} ${config.tokens.TC.name}
${config.tokens.TX.name} Available to mint: ${Web3.utils.fromWei(contracStatus.bprox2AvailableToMint)} ${config.tokens.TX.name}
${config.tokens.TP.name} Available to mint: ${Web3.utils.fromWei(contracStatus.docAvailableToMint)} ${config.tokens.TP.name}
${config.tokens.TP.name} Available to redeem: ${Web3.utils.fromWei(contracStatus.docAvailableToRedeem)} ${config.tokens.TP.name}
${config.tokens.TC.name} Leverage: ${Web3.utils.fromWei(contracStatus.b0Leverage)}
${config.tokens.TC.name} Target Coverage: ${Web3.utils.fromWei(contracStatus.b0Leverage)}
Total ${config.tokens.RESERVE.name} in contract: ${Web3.utils.fromWei(contracStatus.totalBTCAmount)} 
Total ${config.tokens.RESERVE.name} inrate Bag: ${Web3.utils.fromWei(contracStatus.b0BTCInrateBag)} 
Global Coverage: ${Web3.utils.fromWei(contracStatus.globalCoverage)} 
${config.tokens.TX.name} Coverage: ${Web3.utils.fromWei(contracStatus.x2Coverage)}
${config.tokens.TX.name} Leverage: ${Web3.utils.fromWei(contracStatus.x2Leverage)}
${config.tokens.TC.name} Price: ${Web3.utils.fromWei(contracStatus.bproPriceInUsd)} USD
${config.tokens.TX.name} Price: ${Web3.utils.fromWei(contracStatus.bprox2PriceInRbtc)} ${config.tokens.RESERVE.name}
Contract State: ${contracStatus.state} 
Contract Paused: ${contracStatus.paused} 
Contract Protected: ${contracStatus.protected} 
    `

  return render
}


const renderContractStatusFlux = (contracStatus, config) => {
  const render = `
maxAbsoluteOperation: ${Web3.utils.fromWei(contracStatus.maxAbsoluteOperation)}
maxOperationalDifference: ${Web3.utils.fromWei(contracStatus.maxOperationalDifference)}
decayBlockSpan: ${contracStatus.decayBlockSpan}
absoluteAccumulator: ${Web3.utils.fromWei(contracStatus.absoluteAccumulator)}
differentialAccumulator: ${Web3.utils.fromWei(contracStatus.differentialAccumulator)}
lastOperationBlockNumber: ${contracStatus.lastOperationBlockNumber}
lastMaxReserveAllowedToMint: ${Web3.utils.fromWei(contracStatus.lastMaxReserveAllowedToMint)}
maxReserveAllowedToMint: ${Web3.utils.fromWei(contracStatus.maxReserveAllowedToMint)}
maxReserveAllowedToRedeem: ${Web3.utils.fromWei(contracStatus.maxReserveAllowedToRedeem)}
lastMaxReserveAllowedToRedeem: ${Web3.utils.fromWei(contracStatus.lastMaxReserveAllowedToRedeem)} 
    `

  return render
}


const renderUserBalance = (userBalance, config) => {
  let render = `
User: ${userBalance.userAddress}
${config.tokens.RESERVE.name} Balance: ${Web3.utils.fromWei(userBalance.rbtcBalance)} ${config.tokens.RESERVE.name}
${config.tokens.TP.name} Balance: ${Web3.utils.fromWei(userBalance.docBalance)} ${config.tokens.TP.name}
${config.tokens.TC.name} Balance: ${Web3.utils.fromWei(userBalance.bproBalance)} ${config.tokens.TC.name}
${config.tokens.TX.name} Balance: ${Web3.utils.fromWei(userBalance.bprox2Balance)} ${config.tokens.TX.name}
${config.tokens.TG.name} Balance: ${Web3.utils.fromWei(userBalance.mocBalance)} ${config.tokens.TG.name}
${config.tokens.TG.name} Allowance: ${Web3.utils.fromWei(userBalance.mocAllowance)} ${config.tokens.TG.name}
${config.tokens.TP.name} queue to redeem: ${Web3.utils.fromWei(userBalance.docToRedeem)} ${config.tokens.TP.name}
    `

  // Token migrator
  if (process.env.CONTRACT_LEGACY_TP) {

    const tokenMigratorBalance = `
TP Legacy Balance: ${Web3.utils.fromWei(userBalance.tpLegacyBalance)} ${config.tokens.TP.name}
TP Legacy Allowance: ${Web3.utils.fromWei(userBalance.tpLegacyAllowance)} ${config.tokens.TP.name}
    `
    render += tokenMigratorBalance
  }

  return render
}

const statusFromContracts = async (web3, dContracts, configProject) => {
  // Read current status info from different contract MoCState.sol MoCInrate.sol
  // MoCSettlement.sol MoC.sol in one call throught Multicall
  const dataContractStatus = await contractStatus(web3, dContracts, configProject)

  console.log('\x1b[35m%s\x1b[0m', 'Contract Status')
  console.log()
  console.log('\x1b[32m%s\x1b[0m', renderContractStatus(dataContractStatus, configProject))

  return dataContractStatus
}

const userBalanceFromContracts = async (web3, dContracts, configProject, userAddress) => {
  // Get user token and allowances balance
  const userBalanceStats = await userBalance(web3, dContracts, userAddress, configProject)
  console.log()
  console.log('\x1b[32m%s\x1b[0m', renderUserBalance(userBalanceStats, configProject))

  return userBalanceStats
}

export {
  connectorAddresses,
  contractStatus,
  userBalance,
  readContracts,
  renderUserBalance,
  renderContractStatus,
  statusFromContracts,
  userBalanceFromContracts,
  renderContractStatusFlux
}
