const BigNumber = require('bignumber.js')
const Web3 = require('web3')

const { toContractPrecision, getAppMode, BUCKET_X2 } = require('./utils')
const { sendTransaction } = require('./transaction')
const { addCommissions, calcMintInterest } = require('./moc-base')
const { statusFromContracts, userBalanceFromContracts } = require('./contracts')

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

module.exports = {
  mintStable,
  redeemStable,
  mintRiskpro,
  redeemRiskpro,
  mintRiskprox,
  redeemRiskprox
}
