const { readJsonFile, getWeb3, getAppMode } = require('./lib/utils')
const { readContracts } = require('./lib/contracts')
const { mintStable } = require('./lib/moc-coinbase')
const { mintStableRRC20 } = require('./lib/moc-rrc20')

require('dotenv').config()

const main = async () => {
  const configPath = './config.json'

  const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, config)

  // Get amount from environment
  const amountStable = `${process.env.OPERATION_AMOUNT_MINT_STABLE}`

  const appMode = getAppMode()
  if (appMode === 'MoC') {
    // Collateral Coinbase
    const { receipt, filteredEvents } = await mintStable(web3, dContracts, config, amountStable)
  } else {
    // Collateral RRC20
    const { receipt, filteredEvents } = await mintStableRRC20(web3, dContracts, config, amountStable)
  }
}

main()