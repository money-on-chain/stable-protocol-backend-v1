// Mint Collateral Token

import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v1/contracts.js'
import { mintTC } from '../../src/moc-v1/moc-coinbase.js'
import { mintTCRRC20 } from '../../src/moc-v1/moc-rrc20.js'

dotenv.config()

const main = async () => {
  const configPath = './settings/projects.json'
  const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, configProject)

  // Get amount from environment
  const amountTC = `${process.env.OPERATION_AMOUNT_MINT_TC}`

  if (configProject.appMode === 'MoC') {
    // Collateral Coinbase
    const { receipt, filteredEvents } = await mintTC(web3, dContracts, configProject, amountTC)
  } else {
    // Collateral RRC20
    const { receipt, filteredEvents } = await mintTCRRC20(web3, dContracts, configProject, amountTC)
  }
}

main()
