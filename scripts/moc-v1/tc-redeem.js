// Redeem Collateral Token

import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v1/contracts.js'
import { redeemTC } from '../../src/moc-v1/moc-collateral-bag.js'

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts from one address of the MoC.sol
    const dContracts = await readContracts(web3, configProject)

    // Get amount from environment
    const amountTC = `${process.env.OPERATION_AMOUNT_REDEEM_TC}`

    const { receipt, filteredEvents } = await redeemTC(web3, dContracts, configProject, 0, amountTC)

}

main()
