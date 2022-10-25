const { readJsonFile, getWeb3, getAppMode, toContractPrecision } = require('./lib/utils')
const { readContracts } = require('./lib/contracts')
const { mintStable } = require('./lib/moc-coinbase')
const { mintStableRRC20 } = require('./lib/moc-rrc20')
const { statusFromContracts } = require('./lib/contracts')
const BigNumber = require('bignumber.js')
const Web3 = require('web3')


require('dotenv').config()


const TransactionTypeIdsMoC = {
  MINT_BPRO_FEES_RBTC: 1,
  REDEEM_BPRO_FEES_RBTC: 2,
  MINT_DOC_FEES_RBTC: 3,
  REDEEM_DOC_FEES_RBTC: 4,
  MINT_BTCX_FEES_RBTC: 5,
  REDEEM_BTCX_FEES_RBTC: 6,
  MINT_BPRO_FEES_MOC: 7,
  REDEEM_BPRO_FEES_MOC: 8,
  MINT_DOC_FEES_MOC: 9,
  REDEEM_DOC_FEES_MOC: 10,
  MINT_BTCX_FEES_MOC: 11,
  REDEEM_BTCX_FEES_MOC: 12,
}

const main = async () => {
  const configPath = './config.json'

  const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, config)

  // Get amount from environment
  const amountStable = `${process.env.OPERATION_AMOUNT_MINT_TP}`

  // Get vendor from environment
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, config)

  // get bitcoin price from contract
  const bitcoinPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.bitcoinPrice))

  // Stable amount in reserve
  const reserveAmount = new BigNumber(amountStable).div(bitcoinPrice)

  // Moc Inrate contract
  const mocinrate = dContracts.contracts.mocinrate

  const commissions = {}
  commissions.commission_reserve =  await mocinrate.methods.calcCommissionValue(
        toContractPrecision(reserveAmount),
        TransactionTypeIdsMoC.MINT_DOC_FEES_RBTC).call()
  commissions.commission_moc =  await mocinrate.methods.calcCommissionValue(
        toContractPrecision(reserveAmount),
        TransactionTypeIdsMoC.MINT_DOC_FEES_MOC).call()
  commissions.vendorMarkup = await mocinrate.methods.calculateVendorMarkup(
        vendorAddress,
        toContractPrecision(reserveAmount)).call()

  // Calculate commissions using Reserve payment
  const commissionInReserve = new BigNumber(Web3.utils.fromWei(commissions.commission_reserve))
    .plus(new BigNumber(Web3.utils.fromWei(commissions.vendorMarkup)))

  // Calculate commissions using MoC Token payment
  const commissionInMoc = new BigNumber(Web3.utils.fromWei(commissions.commission_moc))
    .plus(new BigNumber(Web3.utils.fromWei(commissions.vendorMarkup)))
    .times(bitcoinPrice).div(Web3.utils.fromWei(dataContractStatus.mocPrice))

  valueToSend = new BigNumber(reserveAmount).plus(commissionInReserve)

  console.log(`To mint: ${amountStable} DOC`)
  console.log(`You need to send already include commissions: ${valueToSend} RBTC`)
  console.log(``)
  console.log(`Total Commissions: ${commissionInReserve} RBTC`)




}

main()
