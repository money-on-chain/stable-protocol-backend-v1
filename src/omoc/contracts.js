/* eslint-disable no-undef */
import BigNumber from 'bignumber.js'
import * as dotenv from 'dotenv'

import { readJsonFile } from '../utils.js'
import { addABIOMoC } from '../transaction.js'

import { registryAddresses } from '../omoc/multicall.js'

dotenv.config()

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })

const readContracts = async (web3, configProject, dContracts) => {
  // Omoc Contracts
  const IRegistry = readJsonFile('./abis/omoc/IRegistry.json')
  dContracts.json.IRegistry = IRegistry

  const IStakingMachine = readJsonFile('./abis/omoc/IStakingMachine.json')
  dContracts.json.IStakingMachine = IStakingMachine

  const IDelayMachine = readJsonFile('./abis/omoc/IDelayMachine.json')
  dContracts.json.IDelayMachine = IDelayMachine

  const ISupporters = readJsonFile('./abis/omoc/ISupporters.json')
  dContracts.json.ISupporters = ISupporters

  const IVestingMachine = readJsonFile('./abis/omoc/IVestingMachine.json')
  dContracts.json.IVestingMachine = IVestingMachine

  const IVotingMachine = readJsonFile('./abis/omoc/IVotingMachine.json')
  dContracts.json.IVotingMachine = IVotingMachine

  const IVestingFactory = readJsonFile('./abis/omoc/IVestingFactory.json')
  dContracts.json.IVestingFactory = IVestingFactory

  console.log('Reading OMOC: IRegistry Contract... address: ', process.env.CONTRACT_IREGISTRY)
  const iregistry = new web3.eth.Contract(IRegistry.abi, process.env.CONTRACT_IREGISTRY)
  dContracts.contracts.iregistry = iregistry

  // Read contracts addresses from registry
  const [
    mocStakingMachineAddress,
    supportersAddress,
    delayMachineAddress,
    vestingMachineAddress,
    votingMachineAddress,
    priceProviderRegistryAddress,
    oracleManagerAddress
  ] = await registryAddresses(web3, dContracts)

  console.log('Reading OMOC: IStakingMachine Contract... address: ', mocStakingMachineAddress)
  const istakingmachine = new web3.eth.Contract(IStakingMachine.abi, mocStakingMachineAddress)
  dContracts.contracts.istakingmachine = istakingmachine

  console.log('Reading OMOC: IDelayMachine Contract... address: ', delayMachineAddress)
  const idelaymachine = new web3.eth.Contract(IDelayMachine.abi, delayMachineAddress)
  dContracts.contracts.idelaymachine = idelaymachine

  console.log('Reading OMOC: ISupporters Contract... address: ', supportersAddress)
  const isupporters = new web3.eth.Contract(ISupporters.abi, supportersAddress)
  dContracts.contracts.isupporters = isupporters

  console.log('Reading OMOC: IVestingFactory Contract... address: ', vestingMachineAddress)
  const ivestingfactory = new web3.eth.Contract(IVestingFactory.abi, vestingMachineAddress)
  dContracts.contracts.ivestingfactory = ivestingfactory

  // reading vesting machine from enviroment address
  if (typeof process.env.CONTRACT_OMOC_VESTING_ADDRESS !== 'undefined') {
    const vestingAddress = `${process.env.CONTRACT_OMOC_VESTING_ADDRESS}`.toLowerCase()
    console.log('Reading OMOC: IVestingMachine Contract... address: ', vestingAddress)
    const ivestingmachine = new web3.eth.Contract(IVestingMachine.abi, vestingAddress)
    dContracts.contracts.ivestingmachine = ivestingmachine
  }

  console.log('Reading OMOC: IVotingMachine Contract... address: ', votingMachineAddress)
  const ivotingmachine = new web3.eth.Contract(IVotingMachine.abi, votingMachineAddress)
  dContracts.contracts.ivotingmachine = ivotingmachine

  // Add to abi decoder
  addABIOMoC(dContracts)

  return dContracts
}

export {
  readContracts
}
