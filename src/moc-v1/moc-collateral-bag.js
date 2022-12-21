import BigNumber from "bignumber.js";
import Web3 from "web3";

import {statusFromContracts, userBalanceFromContracts} from "./contracts.js";
import {toContractPrecision, fromContractPrecisionDecimals, toContractPrecisionDecimals} from "../utils.js";
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

    console.log(`Slippage using ${slippage} %. Total to send: ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name}`)

    // Verifications

    // User have sufficient reserve to pay?
    console.log(`To mint ${qTC} ${configProject.tokens.TC.name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
    const userReserveBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].balance, configProject.tokens.CA[caIndex].decimals))
    if (qAssetMax.gt(userReserveBalance)) throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`)

    // Allowance    reserveAllowance
    console.log(`Allowance: To mint ${qTC} ${configProject.tokens.TC.name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
    const userSpendableBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].allowance, configProject.tokens.CA[caIndex].decimals))
    if (qAssetMax.gt(userSpendableBalance)) throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract')

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .mintTC(caAddress,
            toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
            toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals)
        ).estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .mintTC(caAddress,
            toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
            toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals))
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
    const qAssetMin = new BigNumber(reserveAmount).minus(new BigNumber(slippage).div(100).times(reserveAmount))

    console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qAssetMin.toString()} ${configProject.tokens.CA[caIndex].name}`)

    // Verifications

    // User have sufficient TC in balance?
    console.log(`Redeeming ${qTC} ${configProject.tokens.TC.name} ... getting approx: ${reserveAmount} ${configProject.tokens.CA[caIndex].name}... `)
    const userTCBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.TC.balance,
                                                                      configProject.tokens.TC.decimals))
    if (new BigNumber(qTC).gt(userTCBalance))
        throw new Error(`Insufficient ${configProject.tokens.TC.name} user balance`)

    // There are sufficient TC in the contracts to redeem?
    const tcAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.getTCAvailableToRedeem))
    if (new BigNumber(qTC).gt(tcAvailableToRedeem))
        throw new Error(`Insufficient ${configProject.tokens.TC.name}available to redeem in contract`)

    // There are sufficient CA in the contract
    const acBalance = new BigNumber(fromContractPrecisionDecimals(dataContractStatus.getACBalance[caIndex],
                                                                  configProject.tokens.CA[caIndex].decimals))
    if (new BigNumber(reserveAmount).gt(acBalance))
        throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} in the contract. Balance: ${acBalance} ${configProject.tokens.CA[caIndex].name}`)

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .redeemTC(
            caAddress,
            toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
            toContractPrecisionDecimals(qAssetMin, configProject.tokens.CA[caIndex].decimals)
        ).estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .redeemTC(
            caAddress,
            toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
            toContractPrecisionDecimals(qAssetMin, configProject.tokens.CA[caIndex].decimals))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(
        web3,
        valueToSend,
        estimateGas,
        encodedCall,
        MocCAWrapperAddress)

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

    console.log(`Slippage using ${slippage} %. Total to send: ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} `)

    // Verifications

    // User have sufficient reserve to pay?
    console.log(`To mint ${qTP} ${configProject.tokens.TP[tpIndex].name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
    const userReserveBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].balance, configProject.tokens.CA[caIndex].decimals))
    if (qAssetMax.gt(userReserveBalance))
        throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`)

    // Allowance
    console.log(`Allowance: To mint ${qTP} ${configProject.tokens.TP[tpIndex].name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
    const userSpendableBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].allowance, configProject.tokens.CA[caIndex].decimals))
    if (qAssetMax.gt(userSpendableBalance))
        throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract')

    // There are sufficient PEGGED in the contracts to mint?
    const tpAvailableToMint = new BigNumber(fromContractPrecisionDecimals(dataContractStatus.getTPAvailableToMint[tpIndex], configProject.tokens.TP[tpIndex].decimals))
    if (new BigNumber(qAssetMax).gt(tpAvailableToMint))
        throw new Error(`Insufficient ${configProject.tokens.TP.name} available to mint`)

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .mintTP(
            caAddress,
            tpIndex,
            toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
            toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals)
        ).estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .mintTP(
            caAddress,
            tpIndex,
            toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
            toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals)
        )
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
    const qAssetMin = new BigNumber(reserveAmount).minus(new BigNumber(slippage).div(100).times(reserveAmount))

    console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qAssetMin.toString()} ${configProject.tokens.CA[caIndex].name}`)

    // Redeem function... no values sent
    const valueToSend = null

    // Verifications

    // User have sufficient PEGGED Token in balance?
    console.log(`Redeeming ${qTP} ${configProject.tokens.TP[tpIndex].name} ... getting approx: ${reserveAmount} ${configProject.tokens.CA[caIndex].name}... `)
    const userTPBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.TP[tpIndex], configProject.tokens.TP[tpIndex].decimals))
    if (new BigNumber(qTP).gt(userTPBalance))
        throw new Error(`Insufficient ${configProject.tokens.TP[tpIndex].name}  user balance`)

    // There are sufficient Free Pegged Token in the contracts to redeem?
    const tpAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.getTPAvailableToMint[tpIndex]))
    if (new BigNumber(qTP).gt(tpAvailableToRedeem))
        throw new Error(`Insufficient ${configProject.tokens.TP[tpIndex].name}  available to redeem in contract`)

    // There are sufficient CA in the contract
    const acBalance = new BigNumber(fromContractPrecisionDecimals(dataContractStatus.getACBalance[caIndex], configProject.tokens.CA[caIndex].decimals))
    if (new BigNumber(reserveAmount).gt(acBalance))
        throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} in the contract. Balance: ${acBalance} ${configProject.tokens.CA[caIndex].name}`)

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .redeemTP(
            caAddress,
            tpIndex,
            toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
            toContractPrecisionDecimals(qAssetMin, configProject.tokens.CA[caIndex].decimals)
        )
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .redeemTP(
            caAddress,
            tpIndex,
            toContractPrecision(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
            toContractPrecision(qAssetMin, configProject.tokens.CA[caIndex].decimals)
        )
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocCAWrapperAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}

const swapTPforTP = async (web3, dContracts, configProject, iFromTP, iToTP, qTP, caIndex) => {
    // caller sends a Pegged Token and receives another one

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
    const reservePriceFrom = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[iFromTP]))
    const reservePriceTo = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[iToTP]))
    const SwapFees = new BigNumber(Web3.utils.fromWei(dataContractStatus.swapTPforTPFee))

    // Pegged amount in reserve [From]
    const reserveAmountFrom = new BigNumber(qTP).div(reservePriceFrom)

    // Pegged amount [To]
    const amountToTP = reserveAmountFrom.times(reservePriceTo)

    // minimum amount of target Pegged Token that the sender expects to receive
    const qTPMin = new BigNumber(amountToTP).minus(new BigNumber(slippage).div(100).times(amountToTP))

    console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qTPMin.toString()} ${configProject.tokens.TP[iToTP].name}`)

    // maximum amount of Asset that can be spent in fees
    const qAssetMaxFees = new BigNumber(slippage).div(100).times(reserveAmountFrom).plus(reserveAmountFrom).times(SwapFees)

    console.log(`Slippage using ${slippage} %. Maximum amount of asset can be spent in fees: ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} `)

    // Verifications

    // User have sufficient PEGGED Token in balance?
    console.log(`Swap ${qTP} ${configProject.tokens.TP[iFromTP].name} ... getting approx: ${amountToTP} ${configProject.tokens.TP[iToTP].name}... `)
    const userTPBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.TP[iFromTP], configProject.tokens.TP[iFromTP].decimals))
    if (new BigNumber(qTP).gt(userTPBalance))
        throw new Error(`Insufficient ${configProject.tokens.TP[iFromTP].name}  user balance`)

    // Fees user have sufficient reserve to pay?
    console.log(`To pay fees you need > ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
    const userReserveBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].balance, configProject.tokens.CA[caIndex].decimals))
    if (qAssetMaxFees.gt(userReserveBalance))
        throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`)

    // Fees Allowance
    console.log(`Allowance: To pay fees you need > ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
    const userSpendableBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].allowance, configProject.tokens.CA[caIndex].decimals))
    if (qAssetMaxFees.gt(userSpendableBalance))
        throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract')

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await MocCAWrapper.methods
        .swapTPforTP(
            caAddress,
            iFromTP,
            iToTP,
            toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[iFromTP].decimals),
            toContractPrecisionDecimals(new BigNumber(qTPMin), configProject.tokens.TP[iToTP].decimals),
            toContractPrecisionDecimals(qAssetMaxFees, configProject.tokens.CA[caIndex].decimals)
        ).estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = MocCAWrapper.methods
        .swapTPforTP(
            caAddress,
            iFromTP,
            iToTP,
            toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[iFromTP].decimals),
            toContractPrecisionDecimals(new BigNumber(qTPMin), configProject.tokens.TP[iToTP].decimals),
            toContractPrecisionDecimals(qAssetMaxFees, configProject.tokens.CA[caIndex].decimals)
        )
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
    redeemTP,
    swapTPforTP
}
