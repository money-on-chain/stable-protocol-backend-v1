# Money on Chain Integration - Nodejs

Money on chain stable token operations with multi collateral (coinbase or RRC20). Version v0 and v1.

* Mint / Redeem Pegged Token: DoC or RDOC
* Mint / Redeem Collateral Token: BPro or RIFP
* Mint / Redeem Token X: BTCx or RIFx
* Allowance to use RIF
* Enable / Disable Paying Commissions with MoC Token
* Status of Main MoC Contracts
* Admin: Vendor information
* Admin: Vendor add stake
* Admin: Vendor remove stake

### Setup

1. `npm install`
2. Clone `.env.mocTestnet` and save it as `.env` ... use environment you want to use please refer environment table
3. Fill in wallet address and private key (it needs some testnet RBTC) in that file.

```
USER_ADDRESS=
USER_PK=
HOST_URI=https://public-node.testnet.rsk.co
MOC_PROJECT=moc
CONTRACT_MOC=0x2820f6d4D199B8D8838A4B26F9917754B86a0c1F
CONTRACT_MULTICALL2=0xaf7be1ef9537018feda5397d9e3bb9a1e4e27ac8
CONTRACT_IREGISTRY=0xf078375a3dD89dDF4D9dA460352199C6769b5f10
VENDOR_ADDRESS=0xf69287F5Ca3cC3C6d3981f2412109110cB8af076
GAS_MULTIPLIER=2
OPERATION_AMOUNT_MINT_STABLE=10
OPERATION_AMOUNT_REDEEM_STABLE=10
OPERATION_AMOUNT_MINT_RISKPRO=0.0001
OPERATION_AMOUNT_REDEEM_RISKPRO=0.0001
OPERATION_AMOUNT_MINT_RISKPROX=0.0001
OPERATION_AMOUNT_REDEEM_RISKPROX=0.00001
MINT_SLIPPAGE=0.2
ADMIN_VENDORS_ADD_STAKE_AMOUNT=10
ADMIN_VENDORS_REMOVE_STAKE_AMOUNT=10
```

#### Money on Chain projects and tokens 

| Token generic   | Project | Token Name  | Collateral   |
|-----------------|---------|-------------|--------------|
| Pegged (TP)     | MOC     | DOC         | RBTC         |
| Collateral (TC) | MOC     | BPRO        | RBTC         |
| X (TX)          | MOC     | BTCX        | RBTC         |
| Pegged (TP)     | ROC     | RDOC        | RIF          |
| Collateral (TC) | ROC     | RIFP        | RIF          |
| X (TX)          | ROC     | RIFX        | RIF          |


#### Environment table

Environment is our already deployed contracts. For example **mocMainnet2** is our MOC current production enviroment.

| Network Name      | Project | Enviroment                       | Network    |
|-------------------|---------|----------------------------------|------------|
| mocTestnetAlpha   | MOC     |                                  | Testnet    |
| mocTestnet        | MOC     | moc-testnet.moneyonchain.com     | Testnet    |
| mocMainnet2       | MOC     | alpha.moneyonchain.com           | Mainnet    |
| rdocTestnetAlpha  | RIF     |                                  | Testnet    |
| rdocTestnet       | RIF     | rif-testnet.moneyonchain.com     | Testnet    |
| rdocMainnet       | RIF     | rif.moneyonchain.com             | Mainnet    |


### Faucets

In testnet you may need some test tRIF o tRBTC

* **Faucet tRBTC**: https://faucet.rsk.co/
* **Faucet tRIF**: https://faucet.rifos.org/



### How to run scripts


| Command                                           | Action                                        | Obs                                              | 
|---------------------------------------------------|-----------------------------------------------|--------------------------------------------------|
| node scripts/stable-v0/commission-moc-enable.js   | Enable paying commission MoC                  |                                                  |
| node scripts/stable-v0/commission-moc-disable.js  | Disable paying commission MoC                 |                                                  |
| node scripts/stable-v0/tp-mint.js                 | Mint DoC or Rdoc depend of the environment    | In rdoc environment before make allowance action |
| node scripts/stable-v0/tp-redeem.js               | Redeem DoC or Rdoc depend of the environment  |                                                  |
| node scripts/stable-v0/tc-mint.js                 | Mint BPro or RIFP depend of the environment   | In rdoc environment before make allowance action |
| node scripts/stable-v0/tc-redeem.js               | Redeem BPro or RIFP depend of the environment |                                                  |
| node scripts/stable-v0/tx-mint.js                 | Mint BTCx or RIFx depend of the environment   | In rdoc environment before make allowance action |
| node scripts/stable-v0/tx-redeem.js               | Redeem BTCx or RIFx depend of the environment | In rdoc environment before make allowance action |
| node scripts/stable-v0/allowance-reserve-token.js | Allowance to use Reserve Token in MoC         |                                                  |

Example:

`node scripts/stable-v0/contract-status.js`

Result:

```
node scripts/stable-v0/contract-status.js


Reading Multicall2 Contract... address:  0xaf7be1ef9537018feda5397d9e3bb9a1e4e27ac8
Reading MoC Contract... address:  0x2820f6d4D199B8D8838A4B26F9917754B86a0c1F
Reading MoCConnector... address:  0xABB405e01Da6212E2d6fc87bbc460c73201cF6b0
Reading MoC State Contract... address:  0x0adb40132cB0ffcEf6ED81c26A1881e214100555
Reading MoC Inrate Contract... address:  0x76790f846FAAf44cf1B2D717d0A6c5f6f5152B60
Reading MoC Exchange Contract... address:  0xc03Ac60eBbc01A1f4e9b5bb989F359e5D8348919
Reading MoC Settlement  Contract... address:  0x367D283c53f8F10e47424e2AeB102F45eCC49FEa
Reading DOC Token Contract... address:  0xCB46c0ddc60D18eFEB0E586C17Af6ea36452Dae0
Reading BPRO Token Contract... address:  0x4dA7997A819bb46B6758B9102234c289dD2Ad3bf
Reading MoC Token Contract... address:  0x45a97b54021a3F99827641AFe1BFAE574431e6ab
Reading MoC Vendors Contract... address:  0x84b895A1b7be8fAc64d43757479281Bf0b5E3719
Reading contract status ...

Contract Status

RBTC Price: 20313.01 USD
RBTC EMA Price: 21916.638300185512591211 USD
MOC Price: 0.5 USD
BPRO Available to redeem: 13.186063065807900771 BPRO
BTCX Available to mint: 30.329763312062422142 BTCX
DOC Available to mint: 93475.814206036066204569 DOC
DOC Available to redeem: 584060.252100385988435753 DOC
BPRO Leverage: 1.287217215492544006
BPRO Target Coverage: 1.287217215492544006
Total RBTC in contract: 128.893354687331135192 
Total RBTC inrate Bag: 0.000031014568418826 
Global Coverage: 4.479886338349662268 
BTCX Coverage: 2.109675442696165192
BTCX Leverage: 1.901164395933924538
BPRO Price: 21266.957485230759985609 USD
BTCX Price: 1.051986879344816469 RBTC
Contract State: 3 
Contract Paused: false 
Contract Protected: 1500000000000000000 
    
Reading user balance ... account: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
User Balance: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3

User: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
RBTC Balance: 0.129822610624906657 RBTC
DOC Balance: 4000.341130829353748485 DOC
BPRO Balance: 41.982780218139322316 BPRO
BTCX Balance: 0.007079287509122713 BTCX
MOC Balance: 31358.982677120417617073 MOC
MOC Allowance: 9007199254740990.671389927501977624 MOC
DOC queue to redeem: 0 DOC

```
