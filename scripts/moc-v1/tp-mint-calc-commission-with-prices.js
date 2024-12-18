import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v1/contracts.js'

dotenv.config()

const TransactionTypeIdsMoC = {
  MINT_BPRO_FEES_RBTC: 1,
  REDEEM_BPRO_FEES_RBTC: 2,
  MINT_DOC_FEES_RBTC: 3,
  REDEEM_DOC_FEES_RBTC: 4,
  MINT_BTCX_FEES_RBTC: 5,
  REDEEM_BTCX_FEES_RBTC: 6,
  MINT_BPRO_FEES_MOC: 7,
  REDEEM_BPRO_FEES_MOC: 8,
  MINT_DOC_FEES_MOC: 9,
  REDEEM_DOC_FEES_MOC: 10,
  MINT_BTCX_FEES_MOC: 11,
  REDEEM_BTCX_FEES_MOC: 12
}

const main = async () => {
  const configPath = './settings/projects.json'
  const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts from one address of the MoC.sol
  const dContracts = await readContracts(web3, configProject)

  const mocexchange = dContracts.contracts.mocexchange

  /*
  struct CommissionParamsStruct{
    address account; // Address of the user doing the transaction
    uint256 amount; // Amount from which commissions are calculated
    uint8 txTypeFeesMOC; // Transaction type if fees are paid in MoC
    uint8 txTypeFeesRBTC; // Transaction type if fees are paid in RBTC
    address vendorAccount; // Vendor address
  }
  */

  const commissionParamsStruct = {
    account: '0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3',
    amount: '10000000000000',
    txTypeFeesMOC: TransactionTypeIdsMoC.MINT_DOC_FEES_MOC,
    txTypeFeesRBTC: TransactionTypeIdsMoC.MINT_DOC_FEES_RBTC,
    vendorAccount: '0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3'
  }
  const calculateCommission = await mocexchange.methods.calculateCommissionsWithPrices(commissionParamsStruct).call()

  /*
  struct CommissionReturnStruct{
    uint256 btcCommission;
    uint256 mocCommission;
    uint256 btcPrice;
    uint256 mocPrice;
    uint256 btcMarkup;
    uint256 mocMarkup;
  }
  */
  console.log(`btcCommission: ${calculateCommission.btcCommission}`)
  console.log(`mocCommission: ${calculateCommission.mocCommission}`)
  console.log(`btcPrice: ${calculateCommission.btcPrice}`)
  console.log(`mocPrice: ${calculateCommission.mocPrice}`)
  console.log(`btcMarkup: ${calculateCommission.btcMarkup}`)
  console.log(`mocMarkup: ${calculateCommission.mocMarkup}`)
}

main()
