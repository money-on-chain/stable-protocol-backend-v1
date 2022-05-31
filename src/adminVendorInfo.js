const { readJsonFile, getWeb3 } = require('./utils')
const { readContracts, AdminVendorInfo } = require('./core')

require('dotenv').config()

const main = async () => {
  const configPath = './config.json'
  const config = readJsonFile(configPath)[process.env.MOC_ENVIRONMENT]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, config)

  const vendorAddress = `${process.env.VENDOR_ADDRESS}`

  // Get info from vendor
  await AdminVendorInfo(web3, dContracts, vendorAddress)
}

main()
