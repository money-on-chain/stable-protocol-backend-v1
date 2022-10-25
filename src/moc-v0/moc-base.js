import BigNumber from 'bignumber.js'
import Web3 from 'web3'

import { sendTransaction } from '../transaction.js'
import { toContractPrecision, BUCKET_X2 } from '../utils.js'
import { calcCommission } from './multicall.js'

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

const calcMintInterest = async (dContracts, amount) => {
  const mocinrate = dContracts.contracts.mocinrate
  const calcMintInterest = await mocinrate.methods.calcMintInterestValues(BUCKET_X2, toContractPrecision(amount)).call()
  return calcMintInterest
}

export {
  addCommissions,
  AllowPayingCommissionMoC,
  calcMintInterest
}
