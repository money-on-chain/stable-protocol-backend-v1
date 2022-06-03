const BigNumber = require('bignumber.js')
const Web3 = require('web3')

const { toContractPrecision, getAppMode, BUCKET_X2 } = require('./utils')
const { sendTransaction } = require('./transaction')
const { addCommissions, calcMintInterest } = require('./moc-base')
const { statusFromContracts, userBalanceFromContracts } = require('./contracts')

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
  mintStableRRC20,
  redeemStableRRC20,
  mintRiskproRRC20,
  redeemRiskproRRC20,
  mintRiskproxRRC20,
  redeemRiskproxRRC20,
  AllowanceUseReserveToken
}
