import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v1/contracts.js'
import { AllowanceUseWrapper } from '../../src/moc-v1/moc-base.js'

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    // Token to approve
    const token = dContracts.contracts.CA[1]
    const tokenDecimals = configProject.tokens.CA[1].decimals

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await AllowanceUseWrapper(web3, dContracts, token, true, tokenDecimals)
}

main()
