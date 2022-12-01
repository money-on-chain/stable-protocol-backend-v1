import {sendTransaction} from "../transaction.js";

const AllowanceUseCA = async (web3, dContracts, caIndex, allow, configProject) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const caToken = dContracts.contracts.CA[caIndex]
    const caAddress = caToken.options.address
    const MocCAWrapperAddress = dContracts.contracts.MocCAWrapper.options.address

    let amountAllowance = '0'
    const valueToSend = null
    if (allow) {
        amountAllowance = Number.MAX_SAFE_INTEGER.toString()
    }

    // Calculate estimate gas cost
    const estimateGas = await caToken.methods
        .approve(MocCAWrapperAddress, web3.utils.toWei(amountAllowance))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = caToken.methods
        .approve(MocCAWrapperAddress, web3.utils.toWei(amountAllowance))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, caAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}

export {
    AllowanceUseCA
}
