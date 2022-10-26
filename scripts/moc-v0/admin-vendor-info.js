import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v0/contracts.js'
import { AdminVendorInfo } from '../../src/moc-v0/moc-vendors.js'

dotenv.config()

const main = async () => {
  const configPath = './settings/projects.json'
  const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, configProject)

  const vendorAddress = `${process.env.VENDOR_ADDRESS}`

  // Get info from vendor
  await AdminVendorInfo(web3, dContracts, vendorAddress)
}

main()
