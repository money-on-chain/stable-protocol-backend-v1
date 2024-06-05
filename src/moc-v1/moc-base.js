import BigNumber from 'bignumber.js'
import Web3 from 'web3'

import { sendTransaction } from '../transaction.js'
import { toContractPrecision, BUCKET_X2 } from '../utils.js'
import { calcCommission } from './multicall.js'

const addCommissions = async (web3, dContracts, configProject, dataContractStatus, userBalanceStats, reserveAmount, token, action) => {
  // get reserve price from contract
  const reservePrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.bitcoinPrice))

  // Get commissions from contracts
  const commissions = await calcCommission(web3, dContracts, dataContractStatus, reserveAmount, token, action)

  // Calculate commissions using Reserve payment
  const commissionInReserve = new BigNumber(Web3.utils.fromWei(commissions.commission_reserve))
    .plus(new BigNumber(Web3.utils.fromWei(commissions.vendorMarkup)))

  // Calculate commissions using TG payment
  const commissionInTG = new BigNumber(Web3.utils.fromWei(commissions.commission_moc))
    .plus(new BigNumber(Web3.utils.fromWei(commissions.vendorMarkup)))
    .times(reservePrice).div(Web3.utils.fromWei(dataContractStatus.mocPrice))

  // Enough TG to Pay commission with TG
  const enoughTGBalance = BigNumber(Web3.utils.fromWei(userBalanceStats.mocBalance)).gte(commissionInTG)

  // Enough TG allowance to Pay commission with TG
  const enoughTGAllowance = BigNumber(Web3.utils.fromWei(userBalanceStats.mocAllowance)).gt(0) &&
      BigNumber(Web3.utils.fromWei(userBalanceStats.mocAllowance)).gte(commissionInTG)

  // add commission to value send
  let valueToSend

  if (enoughTGBalance && enoughTGAllowance) {
    valueToSend = reserveAmount
    console.log(`Paying commission with ${configProject.tokens.TG.name} Tokens: ${commissionInTG} ${configProject.tokens.TG.name}`)
  } else {
    valueToSend = reserveAmount.plus(commissionInReserve)
    console.log(`Paying commission with ${configProject.tokens.RESERVE.name}: ${commissionInReserve} ${configProject.tokens.RESERVE.name}`)
  }

  return valueToSend
}

const AllowPayingCommissionTG = async (web3, dContracts, allow) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const tg = dContracts.contracts.tg

  let amountAllowance = '0'
  const valueToSend = null
  if (allow) {
    amountAllowance = Number.MAX_SAFE_INTEGER.toString()
  }

  // Calculate estimate gas cost
  const estimateGas = await tg.methods
    .approve(dContracts.contracts.moc._address, web3.utils.toWei(amountAllowance))
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = tg.methods
    .approve(dContracts.contracts.moc._address, web3.utils.toWei(amountAllowance))
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, tg._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const calcMintInterest = async (dContracts, amount) => {
  const mocinrate = dContracts.contracts.mocinrate
  const calcMintInterest = await mocinrate.methods.calcMintInterestValues(BUCKET_X2, toContractPrecision(amount)).call()
  return calcMintInterest
}

const AllowUseTokenMigrator = async (web3, dContracts, allow) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()

  if (!dContracts.contracts.tp_legacy) console.log("Error: Please set token migrator address!")

  const tp_legacy = dContracts.contracts.tp_legacy
  const tokenMigrator = dContracts.contracts.token_migrator

  let amountAllowance = '0'
  const valueToSend = null
  if (allow) {
    amountAllowance = Number.MAX_SAFE_INTEGER.toString()
  }

  // Calculate estimate gas cost
  const estimateGas = await tp_legacy.methods
      .approve(tokenMigrator._address, web3.utils.toWei(amountAllowance))
      .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = tp_legacy.methods
      .approve(tokenMigrator._address, web3.utils.toWei(amountAllowance))
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, tp_legacy._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const MigrateToken = async (web3, dContracts) => {

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()

  if (!dContracts.contracts.token_migrator) console.log("Error: Please set token migrator address!")

  const tokenMigrator = dContracts.contracts.token_migrator

  // Calculate estimate gas cost
  const estimateGas = await tokenMigrator.methods
      .migrateToken()
      .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = tokenMigrator.methods
      .migrateToken()
      .encodeABI()

  const valueToSend = null

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, tokenMigrator._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

export {
  addCommissions,
  AllowPayingCommissionTG,
  calcMintInterest,
  AllowUseTokenMigrator,
  MigrateToken
}
