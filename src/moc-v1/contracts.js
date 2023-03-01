import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import * as dotenv from 'dotenv'

import { readJsonFile, fromContractPrecisionDecimals } from '../utils.js'
import { addABIv1 } from '../transaction.js'

import { contractStatus, userBalance } from './multicall.js'

dotenv.config()

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })

const readContracts = async (web3, configProject) => {
  const appProject = configProject.appProject
  const appMode = configProject.appMode

  const dContracts = {}
  dContracts.json = {}
  dContracts.contracts = {}
  dContracts.contractsAddresses = {}

  dContracts.json.Multicall2 = readJsonFile(`./abis/${appProject}/Multicall2.json`)
  dContracts.json.WrappedCollateralAsset = readJsonFile(`./abis/${appProject}/WrappedCollateralAsset.json`)
  dContracts.json.TokenPegged = readJsonFile(`./abis/${appProject}/TokenPegged.json`)
  dContracts.json.CollateralTokenCABag = readJsonFile(`./abis/${appProject}/CollateralTokenCABag.json`)
  dContracts.json.IPriceProvider = readJsonFile(`./abis/${appProject}/IPriceProvider.json`)
  dContracts.json.MocCABag = readJsonFile(`./abis/${appProject}/MocCABag.json`)
  dContracts.json.MocCAWrapper = readJsonFile(`./abis/${appProject}/MocCAWrapper.json`)

  console.log('Reading Multicall2 Contract... address: ', process.env.CONTRACT_MULTICALL2)
  dContracts.contracts.multicall = new web3.eth.Contract(dContracts.json.Multicall2.abi, process.env.CONTRACT_MULTICALL2)

  console.log(`Reading ${configProject.tokens.TP[0].name} Token Contract... address: `, process.env.CONTRACT_TP_0)
  const TP_0 = new web3.eth.Contract(dContracts.json.TokenPegged.abi, process.env.CONTRACT_TP_0)

  console.log(`Reading ${configProject.tokens.TP[1].name} Token Contract... address: `, process.env.CONTRACT_TP_1)
  const TP_1 = new web3.eth.Contract(dContracts.json.TokenPegged.abi, process.env.CONTRACT_TP_1)

  dContracts.contracts.TP = [TP_0, TP_1]

  console.log(`Reading ${configProject.tokens.CA[0].name} Token Contract... address: `, process.env.CONTRACT_CA_0)
  const CA_0 = new web3.eth.Contract(dContracts.json.WrappedCollateralAsset.abi, process.env.CONTRACT_CA_0)

  console.log(`Reading ${configProject.tokens.CA[1].name} Token Contract... address: `, process.env.CONTRACT_CA_1)
  const CA_1 = new web3.eth.Contract(dContracts.json.WrappedCollateralAsset.abi, process.env.CONTRACT_CA_1)

  dContracts.contracts.CA = [CA_0, CA_1]

  console.log(`Reading Price Provider ${configProject.tokens.TP[0].name} Contract... address: `, process.env.CONTRACT_PRICE_PROVIDER_TP_0)
  const PP_TP_0 = new web3.eth.Contract(dContracts.json.IPriceProvider.abi, process.env.CONTRACT_PRICE_PROVIDER_TP_0)

  console.log(`Reading Price Provider ${configProject.tokens.TP[1].name} Contract... address: `, process.env.CONTRACT_PRICE_PROVIDER_TP_1)
  const PP_TP_1 = new web3.eth.Contract(dContracts.json.IPriceProvider.abi, process.env.CONTRACT_PRICE_PROVIDER_TP_1)

  dContracts.contracts.PP_TP = [PP_TP_0, PP_TP_1]

  console.log(`Reading Price Provider ${configProject.tokens.CA[0].name} Tokens Contract... address: `, process.env.CONTRACT_PRICE_PROVIDER_CA_0)
  const PP_CA_0 = new web3.eth.Contract(dContracts.json.IPriceProvider.abi, process.env.CONTRACT_PRICE_PROVIDER_CA_0)

  console.log(`Reading Price Provider ${configProject.tokens.CA[1].name} Tokens Contract... address: `, process.env.CONTRACT_PRICE_PROVIDER_CA_1)
  const PP_CA_1 = new web3.eth.Contract(dContracts.json.IPriceProvider.abi, process.env.CONTRACT_PRICE_PROVIDER_CA_1)

  dContracts.contracts.PP_CA = [PP_CA_0, PP_CA_1]

  console.log('Reading MocCABag Contract... address: ', process.env.CONTRACT_MOC_CA)
  dContracts.contracts.MocCABag = new web3.eth.Contract(dContracts.json.MocCABag.abi, process.env.CONTRACT_MOC_CA)

  console.log('Reading MocCAWrapper Contract... address: ', process.env.CONTRACT_MOC_CA_WRAPPER)
  dContracts.contracts.MocCAWrapper = new web3.eth.Contract(dContracts.json.MocCAWrapper.abi, process.env.CONTRACT_MOC_CA_WRAPPER)

  console.log('Reading CollateralTokenCABag Contract... address: ', process.env.CONTRACT_TC)
  dContracts.contracts.CollateralTokenCABag = new web3.eth.Contract(dContracts.json.CollateralTokenCABag.abi, process.env.CONTRACT_TC)

  // Add to abi decoder
  addABIv1(dContracts)

  return dContracts
}

const renderContractStatus = (contractStatus, config) => {
  const render = `
Contract Status
===============

Total amount of Collateral Asset held in the Collateral Bag (nACcb): ${Web3.utils.fromWei(contractStatus.nACcb)}
Collateral Token in the Collateral Bag (nTCcb): ${Web3.utils.fromWei(contractStatus.nTCcb)}
Total supply of ${config.tokens.TP[0].name}:  ${Web3.utils.fromWei(contractStatus.pegContainer[0])}
Total supply of ${config.tokens.TP[1].name}:  ${Web3.utils.fromWei(contractStatus.pegContainer[1])}
Total supply of ${config.tokens.CA[0].name}:  ${fromContractPrecisionDecimals(contractStatus.getACBalance[0], config.tokens.CA[0].decimals).toString()}
Total supply of ${config.tokens.CA[1].name}:  ${fromContractPrecisionDecimals(contractStatus.getACBalance[1], config.tokens.CA[1].decimals).toString()}


Prices
======

Price ${config.tokens.TP[0].name}:  ${Web3.utils.fromWei(contractStatus.PP_TP[0])}
Price ${config.tokens.TP[1].name}:  ${Web3.utils.fromWei(contractStatus.PP_TP[1])}
Price ${config.tokens.CA[0].name}:  ${Web3.utils.fromWei(contractStatus.PP_CA[0])}
Price ${config.tokens.CA[1].name}:  ${Web3.utils.fromWei(contractStatus.PP_CA[1])}
Price ${config.tokens.TC.name}:  ${Web3.utils.fromWei(contractStatus.getPTCac)}
Price Wrapped Token:  ${Web3.utils.fromWei(contractStatus.getTokenPrice)}


Coverage & Leverage
===================

Bucket global coverage: ${Web3.utils.fromWei(contractStatus.getCglb)}
Target coverage adjusted by all Pegged Token's to Collateral Asset rate moving average (CtargemaCA): ${Web3.utils.fromWei(contractStatus.calcCtargemaCA)}
${config.tokens.TP[0].name} Target Coverage:  ${Web3.utils.fromWei(contractStatus.tpCtarg[0])}
${config.tokens.TP[1].name} Target Coverage:  ${Web3.utils.fromWei(contractStatus.tpCtarg[1])}
${config.tokens.TC.name} Leverage:  ${Web3.utils.fromWei(contractStatus.getLeverageTC)}


Available
=========

${config.tokens.TC.name} available to redeem:  ${Web3.utils.fromWei(contractStatus.getTCAvailableToRedeem)}
${config.tokens.TP[0].name} available to mint:  ${Web3.utils.fromWei(contractStatus.getTPAvailableToMint[0])}
${config.tokens.TP[1].name} available to mint:  ${Web3.utils.fromWei(contractStatus.getTPAvailableToMint[1])}
Total Collateral available:  ${Web3.utils.fromWei(contractStatus.getTotalACavailable)}


EMA
====

${config.tokens.TP[0].name} EMA:  ${Web3.utils.fromWei(contractStatus.tpEma[0])}
${config.tokens.TP[1].name} EMA:  ${Web3.utils.fromWei(contractStatus.tpEma[1])}
Block next calculation: ${contractStatus.nextEmaCalculation}
EMA Block Span: ${contractStatus.emaCalculationBlockSpan}
Should Calculate EMA: ${contractStatus.shouldCalculateEma}


Contract Params
===============
 
Contract Protected threshold <: ${Web3.utils.fromWei(contractStatus.protThrld)}
Contract Liquidation threshold <: ${Web3.utils.fromWei(contractStatus.liqThrld)}
Contract Liquidation enabled: ${contractStatus.liqEnabled}
Contract Liquidated: ${contractStatus.liquidated}
Contract is Liquidation Reached: ${contractStatus.isLiquidationReached}


Settlement
==========

Nº of blocks between settlements: ${contractStatus.bes}
Next settlement block: ${contractStatus.bns}
Nº of blocks remaining for settlement: ${contractStatus.getBts}


Fees
====

Success Fee: ${Web3.utils.fromWei(contractStatus.successFee)}
Appreciation Factor: ${Web3.utils.fromWei(contractStatus.appreciationFactor)}
Fee Retainer: ${Web3.utils.fromWei(contractStatus.feeRetainer)}
Token Collateral Mint Fee: ${Web3.utils.fromWei(contractStatus.tcMintFee)}
Token Collateral Redeem Fee: ${Web3.utils.fromWei(contractStatus.tcRedeemFee)}
Swap TP x TP Fee: ${Web3.utils.fromWei(contractStatus.swapTPforTPFee)}
Swap TP x TC Fee: ${Web3.utils.fromWei(contractStatus.swapTPforTCFee)}
Redeem TC & TP Fee: ${Web3.utils.fromWei(contractStatus.redeemTCandTPFee)}
Mint TC & TP Fee: ${Web3.utils.fromWei(contractStatus.mintTCandTPFee)}
Mint ${config.tokens.TP[0].name} Fee:  ${Web3.utils.fromWei(contractStatus.tpMintFee[0])}
Mint ${config.tokens.TP[1].name} Fee:  ${Web3.utils.fromWei(contractStatus.tpMintFee[1])}
Redeem ${config.tokens.TP[0].name} Fee:  ${Web3.utils.fromWei(contractStatus.tpRedeemFee[0])}
Redeem ${config.tokens.TP[1].name} Fee:  ${Web3.utils.fromWei(contractStatus.tpRedeemFee[1])}
Blockheight: ${contractStatus.blockHeight}  
    `

  return render
}

const renderUserBalance = (userBalance, config) => {
  const render = `
User: ${userBalance.userAddress}

${config.tokens.COINBASE.name} Balance: ${fromContractPrecisionDecimals(userBalance.coinbase, config.tokens.COINBASE.decimals).toString()} ${config.tokens.COINBASE.name}
${config.tokens.CA[0].name} Balance: ${fromContractPrecisionDecimals(userBalance.CA[0].balance, config.tokens.CA[0].decimals).toString()} ${config.tokens.CA[0].name}
${config.tokens.CA[0].name} Allowance: ${fromContractPrecisionDecimals(userBalance.CA[0].allowance, config.tokens.CA[0].decimals).toString()} ${config.tokens.CA[0].name}
${config.tokens.CA[1].name} Balance: ${fromContractPrecisionDecimals(userBalance.CA[1].balance, config.tokens.CA[1].decimals).toString()} ${config.tokens.CA[1].name}
${config.tokens.CA[1].name} Allowance: ${fromContractPrecisionDecimals(userBalance.CA[1].allowance, config.tokens.CA[1].decimals).toString()} ${config.tokens.CA[1].name}
${config.tokens.TP[0].name} Balance: ${fromContractPrecisionDecimals(userBalance.TP[0], config.tokens.TP[0].decimals).toString()} ${config.tokens.TP[0].name}
${config.tokens.TP[1].name} Balance: ${fromContractPrecisionDecimals(userBalance.TP[1], config.tokens.TP[1].decimals).toString()} ${config.tokens.TP[1].name}
${config.tokens.TC.name} Balance: ${fromContractPrecisionDecimals(userBalance.TC.balance, config.tokens.TC.decimals).toString()} ${config.tokens.TC.name}
${config.tokens.TC.name} Allowance: ${fromContractPrecisionDecimals(userBalance.TC.allowance, config.tokens.TC.decimals).toString()} ${config.tokens.TC.name}
    `

  return render
}

const statusFromContracts = async (web3, dContracts, configProject) => {
  // Read current status info from different
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
  contractStatus,
  userBalance,
  readContracts,
  renderUserBalance,
  renderContractStatus,
  statusFromContracts,
  userBalanceFromContracts
}
