const { readJsonFile, getWeb3 } = require('./lib/utils')
const { readContracts, contractStatus, userBalance, renderUserBalance, renderContractStatus } = require('./lib/contracts')

require('dotenv').config()

const main = async () => {
  const configPath = './config.json'
  const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT]

  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, config)

  // Read info from different contract MoCState.sol MoCInrate.sol MoCSettlement.sol MoC.sol
  // in one call throught Multicall
  const dataContractStatus = await contractStatus(web3, dContracts)

  console.log('\x1b[35m%s\x1b[0m', 'Contract Status')
  console.log()
  console.log('\x1b[32m%s\x1b[0m', renderContractStatus(dataContractStatus))

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()

  // Get user balance
  const userBalanceStats = await userBalance(web3, dContracts, userAddress)

  console.log('\x1b[35m%s\x1b[0m', `User Balance: ${userAddress}`)
  console.log()
  console.log('\x1b[32m%s\x1b[0m', renderUserBalance(userBalanceStats))
}

main()
