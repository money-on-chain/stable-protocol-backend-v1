import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import fs from 'fs'

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  FORMAT: { decimalSeparator: '.', groupSeparator: ',' }
})

const BUCKET_X2 = '0x5832000000000000000000000000000000000000000000000000000000000000'
const BUCKET_C0 = '0x4330000000000000000000000000000000000000000000000000000000000000'

const readJsonFile = (path) => {
  //console.log('Read json path: ', path)
  let config

  if (fs.existsSync(path)) {
    const rawdata = fs.readFileSync(path)
    config = JSON.parse(rawdata)
  } else {
    throw new Error('Missing json file.')
  }
  return config
}

const getWeb3 = (hostUri) => {
  const web3 = new Web3(hostUri)
  return web3
}

const getGasPrice = async (web3) => {
  try {
    const gasPrice = await web3.eth.getGasPrice()
    //gasPrice = web3.utils.fromWei(gasPrice);
    return gasPrice
  } catch (e) {
    console.log(e)
  }
}

const toContractPrecision = (amount) => {
  return Web3.utils.toWei(amount.toFormat(18, BigNumber.ROUND_DOWN), 'ether')
}

const precision = (contractDecimals) => new BigNumber(10).exponentiatedBy(contractDecimals)

const fromContractPrecisionDecimals = (amount, decimals) => {
  return new BigNumber(amount).div(precision(decimals))
}

const toContractPrecisionDecimals = (amount, decimals) => {
  const result = new BigNumber(amount.toFormat(decimals, BigNumber.ROUND_DOWN)).times(precision(decimals)).toFixed(0)
  return result
}


const formatVisibleValue = (amount, decimals) => {
  return BigNumber(amount).div(precision(18)).toFormat(decimals, BigNumber.ROUND_UP, {
    decimalSeparator: '.',
    groupSeparator: ','
  })
}

const formatTimestamp = (timestamp) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp)
}

export {
  readJsonFile,
  getWeb3,
  getGasPrice,
  toContractPrecision,
  formatVisibleValue,
  formatTimestamp,
  fromContractPrecisionDecimals,
  toContractPrecisionDecimals,
  BUCKET_X2,
  BUCKET_C0
}
