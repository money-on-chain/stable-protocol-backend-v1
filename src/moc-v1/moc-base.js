import {sendTransaction} from "../transaction.js";
import {toContractPrecisionDecimals} from "../utils.js";
import BigNumber from "bignumber.js";
import {statusFromContracts} from "./contracts.js";
import Web3 from "web3";

const AllowanceUseWrapper = async (web3, dContracts, token, allow, tokenDecimals) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const tokenAddress = token.options.address
    const MocCAWrapperAddress = dContracts.contracts.MocCAWrapper.options.address

    let amountAllowance = new BigNumber('0')
    const valueToSend = null
    if (allow) {
        amountAllowance = new BigNumber(1000) //Number.MAX_SAFE_INTEGER.toString()
    }

    // Calculate estimate gas cost
    const estimateGas = await token.methods
        .approve(MocCAWrapperAddress, toContractPrecisionDecimals(amountAllowance, tokenDecimals))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = token.methods
        .approve(MocCAWrapperAddress, toContractPrecisionDecimals(amountAllowance, tokenDecimals))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, tokenAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}

const SettlementExecute = async (web3, dContracts, configProject) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const MocCABag = dContracts.contracts.MocCABag
    const MocCABagAddress = MocCABag.options.address

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

    // Get if block to settlement > 0 to continue
    const getBts = new BigNumber(dataContractStatus.getBts)
    if (getBts.gt(0)) throw new Error(`Not time to execute settlement`)

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await MocCABag.methods
        .execSettlement()
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCABag.methods
        .execSettlement()
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocCABagAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}

const UpdateEma = async (web3, dContracts, configProject) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const MocCABag = dContracts.contracts.MocCABag
    const MocCABagAddress = MocCABag.options.address

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

    // shouldCalculateEma ?
    if (!dataContractStatus.shouldCalculateEma) throw new Error(`Not time to update EMA`)

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await MocCABag.methods
        .updateEmas()
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCABag.methods
        .updateEmas()
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocCABagAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}



export {
    AllowanceUseWrapper,
    SettlementExecute,
    UpdateEma
}
