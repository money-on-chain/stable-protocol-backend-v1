import {sendTransaction} from "../transaction.js";

const AllowanceUseWrapper = async (web3, dContracts, token, allow, configProject) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const tokenAddress = token.options.address
    const MocCAWrapperAddress = dContracts.contracts.MocCAWrapper.options.address

    let amountAllowance = '0'
    const valueToSend = null
    if (allow) {
        amountAllowance = Number.MAX_SAFE_INTEGER.toString()
    }

    // Calculate estimate gas cost
    const estimateGas = await token.methods
        .approve(MocCAWrapperAddress, web3.utils.toWei(amountAllowance))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = token.methods
        .approve(MocCAWrapperAddress, web3.utils.toWei(amountAllowance))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, tokenAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}

export {
    AllowanceUseWrapper
}
