import { readJsonFile } from '../utils.js'

const registryAddresses = async (web3, dContracts) => {
  // getting constants from omoc.json
  const configOmoc = readJsonFile('./settings/omoc.json')
  const multicall = dContracts.contracts.multicall
  const iregistry = dContracts.contracts.iregistry

  const listMethods = [
    [iregistry.options.address, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_STAKING_MACHINE).encodeABI()],
    [iregistry.options.address, iregistry.methods.getAddress(configOmoc.RegistryConstants.SUPPORTERS_ADDR).encodeABI()],
    [iregistry.options.address, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_DELAY_MACHINE).encodeABI()],
    [iregistry.options.address, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_VESTING_MACHINE).encodeABI()],
    [iregistry.options.address, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_VOTING_MACHINE).encodeABI()],
    [iregistry.options.address, iregistry.methods.getAddress(configOmoc.RegistryConstants.MOC_PRICE_PROVIDER_REGISTRY).encodeABI()],
    [iregistry.options.address, iregistry.methods.getAddress(configOmoc.RegistryConstants.ORACLE_MANAGER_ADDR).encodeABI()]
  ]

  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, listMethods).call()

  const listReturnData = multicallResult[2].map(x => web3.eth.abi.decodeParameter('address', x.returnData))

  return listReturnData
}

const omocInfoAddress = async (web3, dContracts, userAddress, vestingAddress) => {
  const multicall = dContracts.contracts.multicall
  const istakingmachine = dContracts.contracts.istakingmachine
  const idelaymachine = dContracts.contracts.idelaymachine
  const isupporters = dContracts.contracts.isupporters
  const ivestingmachine = dContracts.contracts.ivestingmachine
  const ivestingfactory = dContracts.contracts.ivestingfactory
  const tg = dContracts.contracts.tg

  const listMethods = [
    [istakingmachine.options.address, istakingmachine.methods.getBalance(userAddress).encodeABI(), 'uint256'], // 0
    [istakingmachine.options.address, istakingmachine.methods.getLockedBalance(userAddress).encodeABI(), 'uint256'], // 1
    // [istakingmachine.options.address, istakingmachine.methods.getLockingInfo(userAddress).encodeABI(), ['uint256', 'uint256']], // 2
    [istakingmachine.options.address, istakingmachine.methods.getLockingInfo(userAddress).encodeABI(), [{ type: 'uint256', name: 'amount' }, { type: 'uint256', name: 'untilTimestamp' }]], // 2
    [istakingmachine.options.address, istakingmachine.methods.getWithdrawLockTime().encodeABI(), 'uint256'], // 3
    [istakingmachine.options.address, istakingmachine.methods.getSupporters().encodeABI(), 'address'], // 4
    [istakingmachine.options.address, istakingmachine.methods.getOracleManager().encodeABI(), 'address'], // 5
    [istakingmachine.options.address, istakingmachine.methods.getDelayMachine().encodeABI(), 'address'], // 6
    [idelaymachine.options.address, idelaymachine.methods.getTransactions(userAddress).encodeABI(), [{ type: 'uint256[]', name: 'ids' }, { type: 'uint256[]', name: 'amounts' }, { type: 'uint256[]', name: 'expirations' }]], // 7
    [idelaymachine.options.address, idelaymachine.methods.getBalance(userAddress).encodeABI(), 'uint256'], // 8
    [idelaymachine.options.address, idelaymachine.methods.getLastId().encodeABI(), 'uint256'], // 9
    [idelaymachine.options.address, idelaymachine.methods.getSource().encodeABI(), 'address'], // 10
    [isupporters.options.address, isupporters.methods.isReadyToDistribute().encodeABI(), 'bool'], // 11
    [isupporters.options.address, isupporters.methods.mocToken().encodeABI(), 'address'], // 12
    [isupporters.options.address, isupporters.methods.period().encodeABI(), 'uint256'], // 13
    [isupporters.options.address, isupporters.methods.totalMoc().encodeABI(), 'uint256'], // 14
    [isupporters.options.address, isupporters.methods.totalToken().encodeABI(), 'uint256'], // 15
    [tg.options.address, tg.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 16
    [tg.options.address, tg.methods.allowance(userAddress, istakingmachine.options.address).encodeABI(), 'uint256'], // 17
    [ivestingfactory.options.address, ivestingfactory.methods.isTGEConfigured().encodeABI(), 'bool'], // 18
    [ivestingfactory.options.address, ivestingfactory.methods.getTGETimestamp().encodeABI(), 'uint256'] // 19
  ]

  if (typeof ivestingmachine !== 'undefined') {
    listMethods.push([ivestingmachine.options.address, ivestingmachine.methods.getParameters().encodeABI(), [{ type: 'uint256[]', name: 'percentages' }, { type: 'uint256[]', name: 'timeDeltas' }]]) // 20
    listMethods.push([ivestingmachine.options.address, ivestingmachine.methods.getHolder().encodeABI(), 'address']) // 21
    listMethods.push([ivestingmachine.options.address, ivestingmachine.methods.getLocked().encodeABI(), 'uint256']) // 22
    listMethods.push([ivestingmachine.options.address, ivestingmachine.methods.getAvailable().encodeABI(), 'uint256']) // 23
    listMethods.push([ivestingmachine.options.address, ivestingmachine.methods.isVerified().encodeABI(), 'bool']) // 24
    listMethods.push([ivestingmachine.options.address, ivestingmachine.methods.getTotal().encodeABI(), 'uint256']) // 25
    listMethods.push([tg.options.address, tg.methods.balanceOf(ivestingmachine.options.address).encodeABI(), 'uint256']) // 26
  }

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])

  // Multicall results
  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call()

  const listReturnData = []
  let itemIndex = 0
  for (const item of multicallResult[2]) {
    if (typeof listMethods[itemIndex][2] === 'string') {
      listReturnData.push(web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))
    } else {
      listReturnData.push(web3.eth.abi.decodeParameters(listMethods[itemIndex][2], item.returnData))
    }
    itemIndex += 1
  }

  // Dictionary info
  const omocInfo = {}
  omocInfo.userAddress = userAddress
  omocInfo.vestingAddress = vestingAddress
  omocInfo.mocBalance = listReturnData[16]
  omocInfo.stakingmachine = {}
  omocInfo.stakingmachine.getBalance = listReturnData[0]
  omocInfo.stakingmachine.getLockedBalance = listReturnData[1]
  omocInfo.stakingmachine.getLockingInfo = listReturnData[2]
  omocInfo.stakingmachine.getWithdrawLockTime = listReturnData[3]
  omocInfo.stakingmachine.getSupporters = listReturnData[4]
  omocInfo.stakingmachine.getOracleManager = listReturnData[5]
  omocInfo.stakingmachine.getDelayMachine = listReturnData[6]
  omocInfo.stakingmachine.mocAllowance = listReturnData[17]
  omocInfo.delaymachine = {}
  omocInfo.delaymachine.getTransactions = listReturnData[7]
  omocInfo.delaymachine.getBalance = listReturnData[8]
  omocInfo.delaymachine.getLastId = listReturnData[9]
  omocInfo.delaymachine.getSource = listReturnData[10]
  omocInfo.supporters = {}
  omocInfo.supporters.isReadyToDistribute = listReturnData[11]
  omocInfo.supporters.mocToken = listReturnData[12]
  omocInfo.supporters.period = listReturnData[13]
  omocInfo.supporters.totalMoc = listReturnData[14]
  omocInfo.supporters.totalToken = listReturnData[15]
  omocInfo.vestingfactory = {}
  omocInfo.vestingfactory.isTGEConfigured = listReturnData[18]
  omocInfo.vestingfactory.getTGETimestamp = listReturnData[19]

  if (typeof ivestingmachine !== 'undefined') {
    omocInfo.vestingmachine = {}
    omocInfo.vestingmachine.getParameters = listReturnData[20]
    omocInfo.vestingmachine.getHolder = listReturnData[21]
    omocInfo.vestingmachine.getLocked = listReturnData[22]
    omocInfo.vestingmachine.getAvailable = listReturnData[23]
    omocInfo.vestingmachine.isVerified = listReturnData[24]
    omocInfo.vestingmachine.getTotal = listReturnData[25]
    omocInfo.vestingmachine.mocBalance = listReturnData[26]
  } else {
    omocInfo.vestingmachine = {}
    omocInfo.vestingmachine.getParameters = ''
    omocInfo.vestingmachine.getHolder = ''
    omocInfo.vestingmachine.getLocked = ''
    omocInfo.vestingmachine.getAvailable = ''
    omocInfo.vestingmachine.isVerified = ''
    omocInfo.vestingmachine.getTotal = ''
    omocInfo.vestingmachine.mocBalance = ''
  }

  return omocInfo
}

export {
  omocInfoAddress,
  registryAddresses
}
