const { readJsonFile, getWeb3 } = require('./utils')
const { readContracts, mintRiskprox, mintRiskproxRRC20, getAppMode } = require('./core')

require('dotenv').config()

const main = async () => {
  const configPath = './config.json'

  const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, config)

  // Get amount from environment
  const amountRiskprox = `${process.env.OPERATION_AMOUNT_MINT_RISKPROX}`

  const appMode = getAppMode()
  if (appMode === 'MoC') {
    // Collateral Coinbase
    const { receipt, filteredEvents } = await mintRiskprox(web3, dContracts, config, amountRiskprox)
  } else {
    // Collateral RRC20
    const { receipt, filteredEvents } = await mintRiskproxRRC20(web3, dContracts, config, amountRiskprox)
  }
}

main()
