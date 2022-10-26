const { readJsonFile, getWeb3 } = require('./lib/utils')
const { readContracts } = require('./lib/contracts')
const { AllowPayingCommissionMoC } = require('./lib/moc-base')

require('dotenv').config()

const main = async () => {
  const configPath = './config.json'

  const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, config)

  // Send transaction and get receipt
  const { receipt, filteredEvents } = await AllowPayingCommissionMoC(web3, dContracts, true)
}

main()
