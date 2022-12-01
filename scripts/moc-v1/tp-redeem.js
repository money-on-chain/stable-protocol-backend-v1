// Redeem TP

import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v1/contracts.js'
import { mintTP } from '../../src/moc-v1/moc-collateral-bag.js'

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    // Get amount from environment
    const amountTP = `${process.env.OPERATION_AMOUNT_MINT_TP}`

    const { receipt, filteredEvents } = await mintTP(web3, dContracts, configProject, 0, 0, amountTP)

}

main()
