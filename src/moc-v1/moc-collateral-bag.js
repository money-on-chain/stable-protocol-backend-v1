import BigNumber from "bignumber.js";
import Web3 from "web3";

import {statusFromContracts, userBalanceFromContracts} from "./contracts.js";
import {toContractPrecision} from "../utils.js";
import {sendTransaction} from "../transaction.js";

const mintTC = async (web3, dContracts, configProject, caIndex, tcAmount) => {
    // Mint Collateral token with CA

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const mintSlippage = `${process.env.MINT_SLIPPAGE}`

    const MocCAWrapper = dContracts.contracts.MocCAWrapper
    const MocCAWrapperAddress = MocCAWrapper.options.address
    const caToken = dContracts.contracts.CA[caIndex]
    const caAddress = caToken.options.address

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

    // Get user balance address
    const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

    // Price of TC in CA
    const tcPriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.getPTCac))

    // TC amount in reserve
    const reserveAmount = new BigNumber(tcAmount).times(tcPriceInReserve)

    // Add Slippage plus %
    const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount).plus(new BigNumber(tcAmount))

    console.log(`Mint Slippage using ${mintSlippage} %. Total to send: ${mintSlippageAmount.toString()}`)

    // Verifications

    // User have sufficient reserve to pay?
    console.log(`To mint ${tcAmount} ${configProject.tokens.TC.name} you need > ${mintSlippageAmount.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
    const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.CA[caIndex].balance))
    if (mintSlippageAmount.gt(userReserveBalance)) throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`)

    // Allowance    reserveAllowance
    console.log(`Allowance: To mint ${tcAmount} ${configProject.tokens.TC.name} you need > ${mintSlippageAmount.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
    const userSpendableBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.CA[0].allowance))
    if (mintSlippageAmount.gt(userSpendableBalance)) throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract')

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .mintTC(caAddress, toContractPrecision(new BigNumber(tcAmount)), toContractPrecision(mintSlippageAmount))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .mintTC(caAddress, toContractPrecision(new BigNumber(tcAmount)), toContractPrecision(mintSlippageAmount))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocCAWrapperAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}

const redeemTC = async (web3, dContracts, configProject, caIndex, tcAmount) => {
    // Redeem Collateral token receiving CA

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const mintSlippage = `${process.env.MINT_SLIPPAGE}`

    const MocCAWrapper = dContracts.contracts.MocCAWrapper
    const MocCAWrapperAddress = MocCAWrapper.options.address
    const caToken = dContracts.contracts.CA[caIndex]
    const caAddress = caToken.options.address

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

    // Get user balance address
    const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

    // Price of TC in CA
    const tcPriceInReserve = new BigNumber(Web3.utils.fromWei(dataContractStatus.getPTCac))

    // TC amount in reserve
    const reserveAmount = new BigNumber(tcAmount).times(tcPriceInReserve)

    // Redeem function... no values sent
    const valueToSend = null

    // Minimum AC to receive, or fail the tx
    const mintSlippageAmount = new BigNumber(mintSlippage).div(100).times(reserveAmount)

    const minqAC = new BigNumber(tcAmount).minus(mintSlippageAmount)

    console.log(`Mint Slippage using ${mintSlippage} %. Minimum limit to receive: ${minqAC.toString()}`)

    // Verifications

    // User have sufficient TC in balance?
    console.log(`Redeeming ${tcAmount} ${configProject.tokens.TC.name} ... getting aprox: ${reserveAmount} ${configProject.tokens.CA[caIndex].name}... `)
    const userTCBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.CollateralToken))
    if (new BigNumber(tcAmount).gt(userTCBalance)) throw new Error(`Insufficient ${configProject.tokens.TC.name} user balance`)

    // There are sufficient TC in the contracts to redeem?
    const tcAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.getTCAvailableToRedeem))
    if (new BigNumber(tcAmount).gt(tcAvailableToRedeem)) throw new Error(`Insufficient ${configProject.tokens.TC.name} available to redeem in contract`)

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .redeemTC(caAddress, toContractPrecision(new BigNumber(1)), toContractPrecision(new BigNumber(0)))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .redeemTC(caAddress, toContractPrecision(new BigNumber(1)), toContractPrecision(new BigNumber(0)))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocCAWrapperAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


export {
    mintTC,
    redeemTC
}
