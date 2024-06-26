import Web3 from 'web3'
import { sendTransaction } from '../transaction.js'

const AdminVendorInfo = async (web3, dContracts, vendorAddress, configProject) => {
  const mocvendors = dContracts.contracts.mocvendors

  const vendor = await mocvendors.methods.vendors(vendorAddress).call()

  console.log('\x1b[35m%s\x1b[0m', `Vendor Account: ${vendorAddress}`)
  console.log('\x1b[32m%s\x1b[0m', `Is Active: ${vendor.isActive}`)
  console.log('\x1b[35m%s\x1b[0m', `Markup: ${Web3.utils.fromWei(vendor.markup)}`)
  console.log('\x1b[32m%s\x1b[0m', `Total Paid in ${configProject.tokens.TG.name}: ${Web3.utils.fromWei(vendor.totalPaidInMoC)}`)
  console.log('\x1b[35m%s\x1b[0m', `Staking: ${Web3.utils.fromWei(vendor.staking)}`)
}

const AdminVendorAllowance = async (web3, dContracts, allow) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const tg = dContracts.contracts.tg

  let amountAllowance = '0'
  const valueToSend = null
  if (allow) {
    amountAllowance = Number.MAX_SAFE_INTEGER.toString()
  }

  // Calculate estimate gas cost
  const estimateGas = await tg.methods
    .approve(dContracts.contracts.mocvendors._address, web3.utils.toWei(amountAllowance))
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = tg.methods
    .approve(dContracts.contracts.mocvendors._address, web3.utils.toWei(amountAllowance))
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, tg._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const AdminVendorAddStake = async (web3, dContracts, amountStake) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const mocvendors = dContracts.contracts.mocvendors
  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await mocvendors.methods
    .addStake(web3.utils.toWei(amountStake))
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = mocvendors.methods
    .addStake(web3.utils.toWei(amountStake))
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, mocvendors._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const AdminVendorRemoveStake = async (web3, dContracts, amountStake) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const mocvendors = dContracts.contracts.mocvendors
  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await mocvendors.methods
    .removeStake(web3.utils.toWei(amountStake))
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = mocvendors.methods
    .removeStake(web3.utils.toWei(amountStake))
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, mocvendors._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

export {
  AdminVendorInfo,
  AdminVendorAllowance,
  AdminVendorAddStake,
  AdminVendorRemoveStake
}
