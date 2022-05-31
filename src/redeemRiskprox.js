const { readJsonFile, getWeb3 } = require('./utils')
const { readContracts, redeemRiskprox, redeemRiskproxRRC20, getAppMode } = require('./core')

require('dotenv').config()

const main = async () => {
  const configPath = './config.json'

  const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, config)

  // Get amount from environment
  const amountRiskprox = `${process.env.OPERATION_AMOUNT_REDEEM_RISKPROX}`

  const appMode = getAppMode()
  if (appMode === 'MoC') {
    // Collateral Coinbase
    const { receipt, filteredEvents } = await redeemRiskprox(web3, dContracts, config, amountRiskprox)
  } else {
    // Collateral RRC20
    const { receipt, filteredEvents } = await redeemRiskproxRRC20(web3, dContracts, config, amountRiskprox)
  }
}

main()
