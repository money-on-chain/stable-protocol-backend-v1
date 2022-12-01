import BigNumber from "bignumber.js";
import Web3 from "web3";

import {statusFromContracts, userBalanceFromContracts} from "./contracts.js";
import {toContractPrecision} from "../utils.js";
import {sendTransaction} from "../transaction.js";


const mintTC = async (web3, dContracts, configProject, caIndex, qTC) => {
    // Mint Collateral token with CA

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const slippage = `${process.env.MINT_SLIPPAGE}`

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
    const reserveAmount = new BigNumber(qTC).times(tcPriceInReserve)

    // Add Slippage plus %
    const qAssetMax = new BigNumber(slippage).div(100).times(reserveAmount).plus(reserveAmount)

    console.log(`Slippage using ${slippage} %. Total to send: ${qAssetMax.toString()}`)

    // Verifications

    // User have sufficient reserve to pay?
    console.log(`To mint ${qTC} ${configProject.tokens.TC.name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
    const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.CA[caIndex].balance))
    if (qAssetMax.gt(userReserveBalance)) throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`)

    // Allowance    reserveAllowance
    console.log(`Allowance: To mint ${qTC} ${configProject.tokens.TC.name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
    const userSpendableBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.CA[0].allowance))
    if (qAssetMax.gt(userSpendableBalance)) throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract')

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .mintTC(caAddress, toContractPrecision(new BigNumber(qTC)), toContractPrecision(qAssetMax))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .mintTC(caAddress, toContractPrecision(new BigNumber(qTC)), toContractPrecision(qAssetMax))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocCAWrapperAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}

const redeemTC = async (web3, dContracts, configProject, caIndex, qTC) => {
    // Redeem Collateral token receiving CA

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const slippage = `${process.env.REDEEM_SLIPPAGE}`

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
    const reserveAmount = new BigNumber(qTC).times(tcPriceInReserve)

    // Redeem function... no values sent
    const valueToSend = null

    // Minimum AC to receive, or fail the tx
    const qAssetMin = new BigNumber(qTC).minus(new BigNumber(slippage).div(100).times(reserveAmount))

    console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qAssetMin.toString()}`)

    // Verifications

    // User have sufficient TC in balance?
    console.log(`Redeeming ${qTC} ${configProject.tokens.TC.name} ... getting aprox: ${reserveAmount} ${configProject.tokens.CA[caIndex].name}... `)
    const userTCBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.TC.balance))
    if (new BigNumber(qTC).gt(userTCBalance)) throw new Error(`Insufficient ${configProject.tokens.TC.name} user balance`)

    // There are sufficient TC in the contracts to redeem?
    const tcAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.getTCAvailableToRedeem))
    if (new BigNumber(qTC).gt(tcAvailableToRedeem)) throw new Error(`Insufficient ${configProject.tokens.TC.name} available to redeem in contract`)

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .redeemTC(caAddress, toContractPrecision(new BigNumber(qTC)), toContractPrecision(qAssetMin))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .redeemTC(caAddress, toContractPrecision(new BigNumber(qTC)), toContractPrecision(qAssetMin))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocCAWrapperAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}

const mintTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTP) => {
    // Mint pegged token with collateral CA BAG

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const slippage = `${process.env.MINT_SLIPPAGE}`

    const MocCAWrapper = dContracts.contracts.MocCAWrapper
    const MocCAWrapperAddress = MocCAWrapper.options.address
    const caToken = dContracts.contracts.CA[caIndex]
    const caAddress = caToken.options.address

    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

    // Get user balance address
    const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

    // get reserve price from contract
    const reservePrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[tpIndex]))

    // Pegged amount in reserve
    const reserveAmount = new BigNumber(qTP).div(reservePrice)

    // Add Slippage plus %
    const qAssetMax = new BigNumber(slippage).div(100).times(reserveAmount).plus(reserveAmount)

    console.log(`Slippage using ${slippage} %. Total to send: ${qAssetMax.toString()}`)

    // Verifications

    // User have sufficient reserve to pay?
    console.log(`To mint ${qTP} ${configProject.tokens.TP.name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
    const userReserveBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.CA[caIndex].balance))
    if (qAssetMax.gt(userReserveBalance)) throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`)

    // Allowance
    console.log(`Allowance: To mint ${qTP} ${configProject.tokens.TP.name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
    const userSpendableBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.CA[caIndex].allowance))
    if (qAssetMax.gt(userSpendableBalance)) throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract')

    // There are sufficient PEGGED in the contracts to mint?
    const tpAvailableToMint = new BigNumber(Web3.utils.fromWei(dataContractStatus.getTPAvailableToMint[tpIndex]))
    if (new BigNumber(qAssetMax).gt(tpAvailableToMint)) throw new Error(`Insufficient ${configProject.tokens.TP.name} available to mint`)

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .mintTP(caAddress, tpIndex, toContractPrecision(new BigNumber(qTP)), toContractPrecision(qAssetMax))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .mintTP(caAddress, tpIndex, toContractPrecision(new BigNumber(qTP)), toContractPrecision(qAssetMax))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocCAWrapperAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}

const redeemTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTP) => {
    // Redeem pegged token receiving CA

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const slippage = `${process.env.REDEEM_SLIPPAGE}`

    const MocCAWrapper = dContracts.contracts.MocCAWrapper
    const MocCAWrapperAddress = MocCAWrapper.options.address
    const caToken = dContracts.contracts.CA[caIndex]
    const caAddress = caToken.options.address


    // Get information from contracts
    const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

    // Get user balance address
    const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

    // get reserve price from contract
    const reservePrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[tpIndex]))

    // Pegged amount in reserve
    const reserveAmount = new BigNumber(qTP).div(reservePrice)

    // Minimum AC to receive, or fail the tx
    const qAssetMin = new BigNumber(qTP).minus(new BigNumber(slippage).div(100).times(reserveAmount))

    console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qAssetMin.toString()}`)

    // Redeem function... no values sent
    const valueToSend = null

    // Verifications

    // User have sufficient PEGGED Token in balance?
    console.log(`Redeeming ${qTP} ${configProject.tokens.TP[tpIndex].name} ... getting approx: ${reserveAmount} ${configProject.tokens.CA[caIndex].name}... `)
    const userTPBalance = new BigNumber(Web3.utils.fromWei(userBalanceStats.TP[tpIndex]))
    if (new BigNumber(qTP).gt(userTPBalance)) throw new Error(`Insufficient ${configProject.tokens.TP[tpIndex].name}  user balance`)

    // There are sufficient Free Pegged Token in the contracts to redeem?
    const tpAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.getTPAvailableToMint[tpIndex]))
    if (new BigNumber(qTP).gt(tpAvailableToRedeem)) throw new Error(`Insufficient ${configProject.tokens.TP[tpIndex].name}  available to redeem in contract`)

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .redeemTP(caAddress, tpIndex, toContractPrecision(new BigNumber(qTP)), toContractPrecision(qAssetMin))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .redeemTP(caAddress, tpIndex, toContractPrecision(new BigNumber(qTP)), toContractPrecision(qAssetMin))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocCAWrapperAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


export {
    mintTC,
    redeemTC,
    mintTP,
    redeemTP
}
