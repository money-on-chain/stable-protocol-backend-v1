import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v0/contracts.js'
import { AdminVendorAddStake } from '../../src/moc-v0/moc-vendors.js'

dotenv.config()

const main = async () => {
  const configPath = './settings/projects.json'
  const configProject = readJsonFile(configPath)['projects'][process.env.MOC_PROJECT.toLowerCase()]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, configProject)

  // Get amount from environment
  const amountAddStake = `${process.env.ADMIN_VENDORS_ADD_STAKE_AMOUNT}`

  // Send transaction and get receipt
  const { receipt, filteredEvents } = await AdminVendorAddStake(web3, dContracts, amountAddStake)
}

main()
