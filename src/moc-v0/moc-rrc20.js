import BigNumber from 'bignumber.js'
import Web3 from 'web3'

import { toContractPrecision, BUCKET_X2 } from '../utils.js'
import { sendTransaction } from '../transaction.js'
import { addCommissions, calcMintInterest } from './moc-base.js'
import { statusFromContracts, userBalanceFromContracts } from './contracts.js'

const AllowanceUseReserveToken = async (web3, dContracts, allow, configProject) => {
  // Ensure is in correct app mode
  if (configProject.appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

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

const mintTPRRC20 = async (web3, dContracts, configProject, tpAmount) => {
  // Mint pegged token with collateral RRC20

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const mintSlippage = `${process.env.MINT_SLIPPAGE}`

  // Ensure is in correct app mode
  if (configProject.appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // get bitcoin price from contract
  const bitcoinPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.bitcoinPrice))

  // Pegged amount in reserve
  const reserveAmount = new BigNumber(tpAmount).div(bitcoinPrice)

  let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'STABLE', 'MINT')

  // Add Slippage plus %
  const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount)

  console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`)

  // Verifications

  // User have sufficient reserve to pay?
  console.log(`To mint ${tpAmount} ${configProject.tokens.TP.name} you need > ${valueToSend.toString()} ${configProject.tokens.RESERVE.name} in your balance`)
  const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.rbtcBalance))
  if (valueToSend.gt(userReserveBalance)) throw new Error(`Insufficient ${configProject.tokens.RESERVE.name} balance`)

  // Allowance
  console.log(`Allowance: To mint ${tpAmount} ${configProject.tokens.TP.name} you need > ${valueToSend.toString()} ${configProject.tokens.RESERVE.name} in your spendable balance`)
  const userSpendableBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.reserveAllowance))
  if (valueToSend.gt(userSpendableBalance)) throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract')

  // There are sufficient PEGGED in the contracts to mint?
  const tpAvailableToMint = new BigNumber(Web3.utils.fromWei(dataContractStatus.docAvailableToMint))
  if (new BigNumber(tpAmount).gt(tpAvailableToMint)) throw new Error(`Insufficient ${configProject.tokens.TP.name} available to mint`)

  // Mint PEGGED RRC20 function... no values sent
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

const redeemTPRRC20 = async (web3, dContracts, configProject, tpAmount) => {
  // Redeem pegged token receiving coin base

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  // Ensure is in correct app mode
  if (configProject.appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // get bitcoin price from contract
  const bitcoinPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.bitcoinPrice))

  // Pegged amount in reserve
  const reserveAmount = new BigNumber(tpAmount).div(bitcoinPrice)

  // Redeem function... no values sent
  const valueToSend = null

  // Verifications

  // User have sufficient PEGGED Token in balance?
  console.log(`Redeeming ${tpAmount} ${configProject.tokens.TP.name} ... getting approx: ${reserveAmount} ${configProject.tokens.RESERVE.name}... `)
  const userTPBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.docBalance))
  if (new BigNumber(tpAmount).gt(userTPBalance)) throw new Error(`Insufficient ${configProject.tokens.TP.name}  user balance`)

  // There are sufficient Free Pegged Token in the contracts to redeem?
  const tpAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.docAvailableToRedeem))
  if (new BigNumber(tpAmount).gt(tpAvailableToRedeem)) throw new Error(`Insufficient ${configProject.tokens.TP.name}  available to redeem in contract`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .redeemFreeStableTokenVendors(toContractPrecision(new BigNumber(tpAmount)), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .redeemFreeStableTokenVendors(toContractPrecision(new BigNumber(tpAmount)), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const mintTCRRC20 = async (web3, dContracts, configProject, tcAmount) => {
  // Mint Collateral token with collateral RRC20

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const mintSlippage = `${process.env.MINT_SLIPPAGE}`

  // Ensure is in correct app mode
  if (configProject.appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // Price of TC in RESERVE
  const tcPriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.bproPriceInRbtc))

  // TC amount in reserve
  const reserveAmount = new BigNumber(tcAmount).times(tcPriceInReserve)

  let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'RISKPRO', 'MINT')

  // Add Slippage plus %

  const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount)

  console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`)

  // Verifications

  // User have sufficient reserve to pay?
  console.log(`To mint ${tcAmount} ${configProject.tokens.TC.name} you need > ${valueToSend.toString()} ${configProject.tokens.RESERVE.name} in your balance`)
  const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.rbtcBalance))
  if (valueToSend.gt(userReserveBalance)) throw new Error(`Insufficient ${configProject.tokens.RESERVE.name} balance`)

  // Allowance    reserveAllowance
  console.log(`Allowance: To mint ${tcAmount} ${configProject.tokens.TC.name} you need > ${valueToSend.toString()} ${configProject.tokens.RESERVE.name} in your spendable balance`)
  const userSpendableBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.reserveAllowance))
  if (valueToSend.gt(userSpendableBalance)) throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract')

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

const redeemTCRRC20 = async (web3, dContracts, configProject, tcAmount) => {
  // Redeem Collateral token receiving RRC20

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  // Ensure is in correct app mode
  if (configProject.appMode !== 'RRC20') throw new Error('This function is only for RRC20 Mode... are you using in your environment MOC projects?')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // Price of TC in RESERVE
  const tcPriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.bproPriceInRbtc))

  // TC amount in reserve
  const reserveAmount = new BigNumber(tcAmount).times(tcPriceInReserve)

  // Redeem function... no values sent
  const valueToSend = null

  // Verifications

  // User have sufficient TC in balance?
  console.log(`Redeeming ${tcAmount} ${configProject.tokens.TC.name} ... getting aprox: ${reserveAmount} ${configProject.tokens.RESERVE.name}... `)
  const userTCBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.bproBalance))
  if (new BigNumber(tcAmount).gt(userTCBalance)) throw new Error(`Insufficient ${configProject.tokens.TC.name} user balance`)

  // There are sufficient TC in the contracts to redeem?
  const tcAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.bproAvailableToRedeem))
  if (new BigNumber(tcAmount).gt(tcAvailableToRedeem)) throw new Error(`Insufficient ${configProject.tokens.TC.name} available to redeem in contract`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .redeemRiskProVendors(toContractPrecision(new BigNumber(tcAmount)), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .redeemRiskProVendors(toContractPrecision(new BigNumber(tcAmount)), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const mintTXRRC20 = async (web3, dContracts, configProject, txAmount) => {
  // Mint Token X token with collateral RRC20

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const mintSlippage = `${process.env.MINT_SLIPPAGE}`

  // Ensure is in correct app mode
  if (configProject.appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // Price of TX in coinbase
  const txPriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.bprox2PriceInRbtc))

  // TX amount in reserve
  const reserveAmount = new BigNumber(txAmount).times(txPriceInReserve)

  let valueToSend = await addCommissions(web3, dContracts, dataContractStatus, userBalanceStats, reserveAmount, 'RISKPROX', 'MINT')

  // Calc Interest to mint TX
  const mintInterest = await calcMintInterest(dContracts, reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(new BigNumber(Web3.utils.fromWei(mintInterest)))

  console.log(`Mint TX Interest ${mintInterest}`)

  // Add Slippage plus %
  const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount)

  valueToSend = new BigNumber(valueToSend).plus(mintSlippageAmount)

  console.log(`Mint Slippage using ${mintSlippage} %. Slippage amount: ${mintSlippageAmount.toString()} Total to send: ${valueToSend.toString()}`)

  // Verifications

  // User have sufficient reserve to pay?
  console.log(`To mint ${txAmount}  ${configProject.tokens.TX.name} you need > ${valueToSend.toString()} ${configProject.tokens.RESERVE.name} in your balance`)
  const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.rbtcBalance))
  if (valueToSend.gt(userReserveBalance)) throw new Error(`Insufficient ${configProject.tokens.RESERVE.name} balance`)

  // There are sufficient TX in the contracts to mint?
  const txAvalaiblesToMint = new BigNumber(Web3.utils.fromWei(dataContractStatus.bprox2AvailableToMint))
  if (new BigNumber(txAmount).gt(txAvalaiblesToMint)) throw new Error(`Insufficient ${configProject.tokens.TX.name} available to mint`)

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

const redeemTXRRC20 = async (web3, dContracts, configProject, txAmount) => {
  // Redeem token X receiving RRC20

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  // Ensure is in correct app mode
  if (configProject.appMode !== 'RRC20') throw new Error('This function is only for app mode = RRC20')

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // Price of TX in RESERVE
  const txPriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.bprox2PriceInRbtc))

  // TX amount in reserve RESERVE
  const reserveAmount = new BigNumber(txAmount).times(txPriceInReserve)

  // Redeem function... no values sent
  const valueToSend = null

  // Verifications

  // User have sufficient TX in balance?
  console.log(`Redeeming ${txAmount} ${configProject.tokens.TX.name}  ... getting approx: ${reserveAmount} ${configProject.tokens.RESERVE.name} ... `)
  const userTXBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.bprox2Balance))
  if (new BigNumber(txAmount).gt(userTXBalance)) throw new Error(`Insufficient ${configProject.tokens.TX.name}  user balance`)

  const moc = dContracts.contracts.moc

  // Calculate estimate gas cost
  const estimateGas = await moc.methods
    .redeemRiskProxVendors(BUCKET_X2, toContractPrecision(new BigNumber(txAmount)), vendorAddress)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moc.methods
    .redeemRiskProxVendors(BUCKET_X2, toContractPrecision(new BigNumber(txAmount)), vendorAddress)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, dContracts.contracts.moc._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

export {
  mintTPRRC20,
  redeemTPRRC20,
  mintTCRRC20,
  redeemTCRRC20,
  mintTXRRC20,
  redeemTXRRC20,
  AllowanceUseReserveToken
}
