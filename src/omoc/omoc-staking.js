import BigNumber from 'bignumber.js'

import { sendTransaction } from '../transaction.js'
import { formatVisibleValue, formatTimestamp } from '../utils.js'
import { omocInfoAddress } from './multicall.js'

const renderOmocInfo = (omocInfo, config) => {
  const render = `
User: ${omocInfo.userAddress} Vesting: ${omocInfo.vestingAddress}
MoC Balance: ${formatVisibleValue(omocInfo.mocBalance, 2)} 

1. Staking Machine

Balance: ${formatVisibleValue(omocInfo.stakingmachine.getBalance, 2)} 
Allowance: ${formatVisibleValue(omocInfo.stakingmachine.mocAllowance, 2)} 
Locked Balance: ${formatVisibleValue(omocInfo.stakingmachine.getLockedBalance, 2)} 
Withdraw Lock Time: ${omocInfo.stakingmachine.getWithdrawLockTime} 
Supporters: ${omocInfo.stakingmachine.getSupporters} 
Oracle Manager: ${omocInfo.stakingmachine.getOracleManager} 
Delay Machine: ${omocInfo.stakingmachine.getDelayMachine} 

2. Delay Machine

Balance: ${formatVisibleValue(omocInfo.delaymachine.getBalance, 2)} 
Last Id: ${omocInfo.delaymachine.getLastId} 
Source: ${omocInfo.delaymachine.getSource} 

3. Supporters

Ready to distribuite: ${omocInfo.supporters.isReadyToDistribute} 
Moc Token: ${omocInfo.supporters.mocToken} 
Period: ${omocInfo.supporters.period} 
Total MoC: ${formatVisibleValue(omocInfo.supporters.totalMoc, 2)} 
Total Token: ${formatVisibleValue(omocInfo.supporters.totalToken, 2)} 

    `
  /*
  4. Vesting

Holder: ${omocInfo.vestingmachine.getHolder}
Locked: ${formatVisibleValue(omocInfo.vestingmachine.getLocked, 2)}
Available: ${formatVisibleValue(omocInfo.vestingmachine.getAvailable, 2)}
Verified: ${omocInfo.vestingmachine.isVerified}
Total invested MOCs: ${formatVisibleValue(omocInfo.vestingmachine.getTotal, 2)}
MOCs: ${formatVisibleValue(omocInfo.vestingmachine.mocBalance, 2)}
  */
  return render
}

const renderVestingParameters = (omocInfo, config) => {
  const getParameters = omocInfo.vestingmachine.getParameters
  const tgeTimestamp = omocInfo.vestingfactory.getTGETimestamp
  const total = omocInfo.vestingmachine.getTotal
  const percentMultiplier = 10000

  const percentages = getParameters.percentages
  const timeDeltas = getParameters.timeDeltas
  const deltas = [...timeDeltas]
  if (timeDeltas && !new BigNumber(timeDeltas[0]).isZero()) {
    deltas.unshift(new BigNumber(0))
  }
  const percents = percentages.map((x) => new BigNumber(percentMultiplier).minus(x))
  if (percentages && !new BigNumber(percentages[percentages.length - 1]).isZero()) {
    percents.push(new BigNumber(percentMultiplier))
  }

  let dates = []
  if (deltas) {
    if (tgeTimestamp) {
      // Convert timestamp to date.
      dates = deltas.map(x => formatTimestamp(new BigNumber(tgeTimestamp).plus(x).times(1000).toNumber()))
    } else {
      dates = deltas.map(x => x / 60 / 60 / 24)
    }
  }

  let table = ''
  if (getParameters) {
    let itemIndex = 0
    for (const percent of percents) {
      let strTotal = ''
      if (total && !new BigNumber(total).isZero()) {
        strTotal = new BigNumber(percent).times(total).div(percentMultiplier)
      }
      table += `
${dates[itemIndex]} | ${(percent.toNumber() / percentMultiplier * 100).toFixed(2)} % | ${formatVisibleValue(strTotal, 2)} \n`
      itemIndex += 1
    }
  }

  const render = `
${table} 
    `
  return render
}

const OmocInfo = async (web3, dContracts, config, userAddress) => {
  const vestingAddress = `${process.env.OMOC_VESTING_ADDRESS}`.toLowerCase()
  const infoOmoc = await omocInfoAddress(web3, dContracts, userAddress, vestingAddress)

  console.log(infoOmoc)

  console.log('\x1b[35m%s\x1b[0m', 'Omoc Contract Status')
  console.log()
  console.log('\x1b[32m%s\x1b[0m', renderOmocInfo(infoOmoc, config))
  console.log()
  // console.log('\x1b[32m%s\x1b[0m', renderVestingParameters(infoOmoc, config))
}

const StakingAllowance = async (web3, dContracts, allow) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const tg = dContracts.contracts.tg

  let amountAllowance = '0'
  const valueToSend = null
  if (allow) {
    amountAllowance = Number.MAX_SAFE_INTEGER.toString()
  }

  // Calculate estimate gas cost
  const estimateGas = await tg.methods
    .approve(dContracts.contracts.mocvendors._address, web3.utils.toWei(amountAllowance))
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = tg.methods
    .approve(dContracts.contracts.mocvendors._address, web3.utils.toWei(amountAllowance))
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, tg._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const vestingVerify = async (web3, dContracts) => {
  /* Mark contract as verified by holder */
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const ivestingmachine = dContracts.contracts.ivestingmachine

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await ivestingmachine.methods
    .verify()
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = ivestingmachine.methods
    .verify()
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, ivestingmachine._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

export {
  OmocInfo,
  StakingAllowance,
  vestingVerify
}
