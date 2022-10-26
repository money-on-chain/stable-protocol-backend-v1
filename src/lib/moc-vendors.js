const Web3 = require('web3')
const { sendTransaction } = require('./transaction')

const AdminVendorInfo = async (web3, dContracts, vendorAddress) => {
  const mocvendors = dContracts.contracts.mocvendors

  const vendor = await mocvendors.methods.vendors(vendorAddress).call()

  console.log('\x1b[35m%s\x1b[0m', `Vendor Account: ${vendorAddress}`)
  console.log('\x1b[32m%s\x1b[0m', `Is Active: ${vendor.isActive}`)
  console.log('\x1b[35m%s\x1b[0m', `Markup: ${Web3.utils.fromWei(vendor.markup)}`)
  console.log('\x1b[32m%s\x1b[0m', `Total Paid in MoC: ${Web3.utils.fromWei(vendor.totalPaidInMoC)}`)
  console.log('\x1b[35m%s\x1b[0m', `Staking: ${Web3.utils.fromWei(vendor.staking)}`)
}

const AdminVendorAllowance = async (web3, dContracts, allow) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const moctoken = dContracts.contracts.moctoken

  let amountAllowance = '0'
  const valueToSend = null
  if (allow) {
    amountAllowance = Number.MAX_SAFE_INTEGER.toString()
  }

  // Calculate estimate gas cost
  const estimateGas = await moctoken.methods
    .approve(dContracts.contracts.mocvendors._address, web3.utils.toWei(amountAllowance))
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = moctoken.methods
    .approve(dContracts.contracts.mocvendors._address, web3.utils.toWei(amountAllowance))
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, moctoken._address)

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

module.exports = {
  AdminVendorInfo,
  AdminVendorAllowance,
  AdminVendorAddStake,
  AdminVendorRemoveStake
}
