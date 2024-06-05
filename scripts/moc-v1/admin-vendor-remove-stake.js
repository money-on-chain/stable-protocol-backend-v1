import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v1/contracts.js'
import { AdminVendorRemoveStake } from '../../src/moc-v1/moc-vendors.js'

dotenv.config()

const main = async () => {
  const configPath = './settings/projects.json'
  const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, configProject)

  // Get amount from environment
  const amountAddStake = `${process.env.ADMIN_VENDORS_REMOVE_STAKE_AMOUNT}`

  // Send transaction and get receipt
  const { receipt, filteredEvents } = await AdminVendorRemoveStake(web3, dContracts, amountAddStake)
}

main()
