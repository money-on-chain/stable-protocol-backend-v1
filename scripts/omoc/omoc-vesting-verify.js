import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts as readContractsMoC } from '../../src/moc-v0/contracts.js'
import { readContracts as readContractsOMoC } from '../../src/omoc/contracts.js'
import { vestingVerify } from '../../src/omoc/omoc-staking.js'

dotenv.config()

const main = async () => {
  const configPath = './settings/projects.json'
  const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContractsMoC(web3, configProject)
  await readContractsOMoC(web3, configProject, dContracts)

  // Send transaction and get receipt
  const { receipt, filteredEvents } = await vestingVerify(web3, dContracts)
}

main()
