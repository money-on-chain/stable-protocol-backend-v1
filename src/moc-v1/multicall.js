
const contractStatus = async (web3, dContracts, configProject) => {

  const multicall = dContracts.contracts.multicall
  const MocCABag = dContracts.contracts.MocCABag
  const PP_TP_0 = dContracts.contracts.PP_TP[0]
  const PP_TP_1 = dContracts.contracts.PP_TP[1]
  const PP_CA_0 = dContracts.contracts.PP_CA[0]
  const PP_CA_1 = dContracts.contracts.PP_CA[1]
  const MocCAWrapper = dContracts.contracts.MocCAWrapper
  const CA_0 = dContracts.contracts.CA[0]
  const CA_1 = dContracts.contracts.CA[1]

  console.log('Reading contract status ...')

  const listMethods = [
    [MocCABag.options.address, MocCABag.methods.protThrld().encodeABI(), 'uint256'], // 0
    [MocCABag.options.address, MocCABag.methods.liqThrld().encodeABI(), 'uint256'], // 1
    [MocCABag.options.address, MocCABag.methods.liqEnabled().encodeABI(), 'bool'], // 2
    [MocCABag.options.address, MocCABag.methods.liquidated().encodeABI(), 'bool'], // 3
    [MocCABag.options.address, MocCABag.methods.nACcb().encodeABI(), 'uint256'], // 4
    [MocCABag.options.address, MocCABag.methods.tcToken().encodeABI(), 'address'], // 5
    [MocCABag.options.address, MocCABag.methods.nTCcb().encodeABI(), 'uint256'], // 6
    [MocCABag.options.address, MocCABag.methods.successFee().encodeABI(), 'uint256'], // 7
    [MocCABag.options.address, MocCABag.methods.appreciationFactor().encodeABI(), 'uint256'], // 8
    [MocCABag.options.address, MocCABag.methods.feeRetainer().encodeABI(), 'uint256'], // 9
    [MocCABag.options.address, MocCABag.methods.tcMintFee().encodeABI(), 'uint256'], // 10
    [MocCABag.options.address, MocCABag.methods.tcRedeemFee().encodeABI(), 'uint256'], // 11
    [MocCABag.options.address, MocCABag.methods.swapTPforTPFee().encodeABI(), 'uint256'], // 12
    [MocCABag.options.address, MocCABag.methods.swapTPforTCFee().encodeABI(), 'uint256'], // 13
    [MocCABag.options.address, MocCABag.methods.swapTCforTPFee().encodeABI(), 'uint256'], // 14
    [MocCABag.options.address, MocCABag.methods.redeemTCandTPFee().encodeABI(), 'uint256'], // 15
    [MocCABag.options.address, MocCABag.methods.mintTCandTPFee().encodeABI(), 'uint256'], // 16
    [MocCABag.options.address, MocCABag.methods.tpMintFee(0).encodeABI(), 'uint256'], // 17
    [MocCABag.options.address, MocCABag.methods.tpMintFee(1).encodeABI(), 'uint256'], // 18
    [MocCABag.options.address, MocCABag.methods.tpRedeemFee(0).encodeABI(), 'uint256'], // 19
    [MocCABag.options.address, MocCABag.methods.tpRedeemFee(1).encodeABI(), 'uint256'], // 20
    [MocCABag.options.address, MocCABag.methods.mocFeeFlowAddress().encodeABI(), 'address'], // 21
    [MocCABag.options.address, MocCABag.methods.mocAppreciationBeneficiaryAddress().encodeABI(), 'address'], // 22
    [MocCABag.options.address, MocCABag.methods.tpCtarg(0).encodeABI(), 'uint256'], // 23
    [MocCABag.options.address, MocCABag.methods.tpCtarg(1).encodeABI(), 'uint256'], // 24
    [MocCABag.options.address, MocCABag.methods.pegContainer(0).encodeABI(), 'uint256'], // 25
    [MocCABag.options.address, MocCABag.methods.pegContainer(1).encodeABI(), 'uint256'], // 26
    [PP_TP_0.options.address, PP_TP_0.methods.peek().encodeABI(), 'uint256'], // 27
    [PP_TP_1.options.address, PP_TP_1.methods.peek().encodeABI(), 'uint256'], // 28
    [PP_CA_0.options.address, PP_CA_0.methods.peek().encodeABI(), 'uint256'], // 29
    [PP_CA_1.options.address, PP_CA_1.methods.peek().encodeABI(), 'uint256'], // 30
    [MocCABag.options.address, MocCABag.methods.isLiquidationReached().encodeABI(), 'bool'], // 31
    [MocCABag.options.address, MocCABag.methods.getPACtp(0).encodeABI(), 'uint256'], // 32
    [MocCABag.options.address, MocCABag.methods.getPACtp(1).encodeABI(), 'uint256'], // 33
    [MocCABag.options.address, MocCABag.methods.getPTCac().encodeABI(), 'uint256'], // 34
    [MocCABag.options.address, MocCABag.methods.getCglb().encodeABI(), 'uint256'], // 35
    [MocCABag.options.address, MocCABag.methods.getTCAvailableToRedeem().encodeABI(), 'uint256'], // 36
    [MocCABag.options.address, MocCABag.methods.getTPAvailableToMint(0).encodeABI(), 'uint256'], // 37
    [MocCABag.options.address, MocCABag.methods.getTPAvailableToMint(1).encodeABI(), 'uint256'], // 38
    [MocCABag.options.address, MocCABag.methods.getTotalACavailable().encodeABI(), 'uint256'], // 39
    [MocCABag.options.address, MocCABag.methods.getLeverageTC().encodeABI(), 'uint256'], // 40
    [MocCABag.options.address, MocCABag.methods.tpEma(0).encodeABI(), 'uint256'], // 41
    [MocCABag.options.address, MocCABag.methods.tpEma(1).encodeABI(), 'uint256'], // 42
    [MocCABag.options.address, MocCABag.methods.nextEmaCalculation().encodeABI(), 'uint256'], // 43
    [MocCABag.options.address, MocCABag.methods.emaCalculationBlockSpan().encodeABI(), 'uint256'], // 44
    [MocCABag.options.address, MocCABag.methods.calcCtargemaCA().encodeABI(), 'uint256'], // 45
    [MocCABag.options.address, MocCABag.methods.shouldCalculateEma().encodeABI(), 'bool'], // 46
    [MocCABag.options.address, MocCABag.methods.bes().encodeABI(), 'uint256'], // 47
    [MocCABag.options.address, MocCABag.methods.bns().encodeABI(), 'uint256'], // 48
    [MocCABag.options.address, MocCABag.methods.getBts().encodeABI(), 'uint256'], // 49
    [MocCAWrapper.options.address, MocCAWrapper.methods.getTokenPrice().encodeABI(), 'uint256'], // 50
    [CA_0.options.address, CA_0.methods.balanceOf(MocCAWrapper.options.address).encodeABI(), 'uint256'], // 51
    [CA_1.options.address, CA_1.methods.balanceOf(MocCAWrapper.options.address).encodeABI(), 'uint256'], // 52
  ]

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])

  //const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call({}, 3807699)
  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call()

  const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))

  const status = {}
  status.blockHeight = multicallResult[0]
  status.protThrld = listReturnData[0]
  status.liqThrld = listReturnData[1]
  status.liqEnabled = listReturnData[2]
  status.liquidated = listReturnData[3]
  status.nACcb = listReturnData[4]
  status.tcToken = listReturnData[5]
  status.nTCcb = listReturnData[6]
  status.successFee = listReturnData[7]
  status.appreciationFactor = listReturnData[8]
  status.feeRetainer = listReturnData[9]
  status.tcMintFee = listReturnData[10]
  status.tcRedeemFee = listReturnData[11]
  status.swapTPforTPFee = listReturnData[12]
  status.swapTPforTCFee = listReturnData[13]
  status.swapTCforTPFee = listReturnData[14]
  status.redeemTCandTPFee = listReturnData[15]
  status.mintTCandTPFee = listReturnData[16]
  status.tpMintFee = [listReturnData[17], listReturnData[18]]
  status.tpRedeemFee = [listReturnData[19], listReturnData[20]]
  status.mocFeeFlowAddress = listReturnData[21]
  status.mocAppreciationBeneficiaryAddress = listReturnData[22]
  status.tpCtarg = [listReturnData[23], listReturnData[24]]
  status.pegContainer = [listReturnData[25], listReturnData[26]]
  status.PP_TP = [listReturnData[27], listReturnData[28]]
  status.PP_CA = [listReturnData[29], listReturnData[30]]
  status.isLiquidationReached = listReturnData[31]
  status.getPACtp = [listReturnData[32], listReturnData[33]]
  status.getPTCac = listReturnData[34]
  status.getCglb = listReturnData[35]
  status.getTCAvailableToRedeem = listReturnData[36]
  status.getTPAvailableToMint = [listReturnData[37], listReturnData[38]]
  status.getTotalACavailable = listReturnData[39]
  status.getLeverageTC = listReturnData[40]
  status.tpEma = [listReturnData[41], listReturnData[42]]
  status.nextEmaCalculation = listReturnData[43]
  status.emaCalculationBlockSpan = listReturnData[44]
  status.calcCtargemaCA = listReturnData[45]
  status.shouldCalculateEma = listReturnData[46]
  status.bes = listReturnData[47]
  status.bns = listReturnData[48]
  status.getBts = listReturnData[49]
  status.getTokenPrice = listReturnData[50]
  status.getACBalance = [listReturnData[51], listReturnData[52]]

  return status
}

const userBalance = async (web3, dContracts, userAddress, configProject) => {

  const multicall = dContracts.contracts.multicall
  const MocCAWrapper = dContracts.contracts.MocCAWrapper
  const CA_0 = dContracts.contracts.CA[0]
  const CA_1 = dContracts.contracts.CA[1]
  const TP_0 = dContracts.contracts.TP[0]
  const TP_1 = dContracts.contracts.TP[1]
  const CollateralTokenCABag = dContracts.contracts.CollateralTokenCABag

  console.log(`Reading user balance ... account: ${userAddress}`)

  const listMethods = [
    [multicall.options.address, multicall.methods.getEthBalance(userAddress).encodeABI(), 'uint256'], // 0
    [CA_0.options.address, CA_0.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 1
    [CA_0.options.address, CA_0.methods.allowance(userAddress, MocCAWrapper.options.address).encodeABI(), 'uint256'], // 2
    [CA_1.options.address, CA_1.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 3
    [CA_1.options.address, CA_1.methods.allowance(userAddress, MocCAWrapper.options.address).encodeABI(), 'uint256'], // 4
    [TP_0.options.address, TP_0.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 5
    [TP_1.options.address, TP_1.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 6
    [CollateralTokenCABag.options.address, CollateralTokenCABag.methods.balanceOf(userAddress).encodeABI(), 'uint256'], // 7
    [CollateralTokenCABag.options.address, CollateralTokenCABag.methods.allowance(userAddress, MocCAWrapper.options.address).encodeABI(), 'uint256'] // 8
  ]

  // Remove decode result parameter
  const cleanListMethods = listMethods.map(x => [x[0], x[1]])
  const multicallResult = await multicall.methods.tryBlockAndAggregate(false, cleanListMethods).call()
  const listReturnData = multicallResult[2].map((item, itemIndex) => web3.eth.abi.decodeParameter(listMethods[itemIndex][2], item.returnData))

  const userBalance = {}
  userBalance.blockHeight = multicallResult[0]
  userBalance.coinbase = listReturnData[0]
  userBalance.CA = [
      {
        balance: listReturnData[1],
        allowance: listReturnData[2]
      },
      {
        balance: listReturnData[3],
        allowance: listReturnData[4]
      },
  ]
  userBalance.TP = [listReturnData[5], listReturnData[6]]
  userBalance.TC = {
    balance: listReturnData[7],
    allowance: listReturnData[8]
  }

  return userBalance
}

export {
  contractStatus,
  userBalance
}
