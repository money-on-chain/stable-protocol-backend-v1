# Money on Chain Integration - Nodejs

Money on chain stable token operations with multi collateral (coinbase or RRC20) code examples.

* Mint / Redeem Stable Token: DoC or RDOC
* Mint / Redeem RiskPro Token: BPro or RIFP
* Mint / Redeem RiskProX Token: BTCx or RIFx
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
MOC_ENVIRONMENT=mocTestnet
VENDOR_ADDRESS=0xf69287F5Ca3cC3C6d3981f2412109110cB8af076
GAS_MULTIPLIER=2
OPERATION_AMOUNT_MINT_STABLE=10
OPERATION_AMOUNT_REDEEM_STABLE=10
OPERATION_AMOUNT_MINT_RISKPRO=0.0001
OPERATION_AMOUNT_REDEEM_RISKPRO=0.0001
OPERATION_AMOUNT_MINT_RISKPROX=0.0001
OPERATION_AMOUNT_REDEEM_RISKPROX=0.00001
MINT_SLIPPAGE=0.2
```

#### Money on Chain projects and tokens 

| Token generic     | Project | Token Name  | Collateral   |
|-------------------|---------|-------------|--------------|
| Stable            | MOC     | DOC         | RBTC         |
| RiskPro           | MOC     | BPRO        | RBTC         |
| RiskProx          | MOC     | BTCX        | RBTC         |
| Stable            | ROC     | RDOC        | RIF          |
| RiskPro           | ROC     | RIFP        | RIF          |
| RiskProx          | ROC     | RIFX        | RIF          |


#### Enviroment table

Enviroment is our already deployed contracts. For example **mocMainnet2** is our MOC current production enviroment.

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



### How to run


| Command                             | Action                                        | Obs                       | 
|-------------------------------------|-----------------------------------------------|---------------------------|
| npm run commission-moc-enable       | Enable paying commission MoC                  |                           |
| npm run commission-moc-disable      | Disable paying commission MoC                 |                           |
| npm run mint-stable                 | Mint DoC or Rdoc depend of the environment    |  In rdoc environment before make allowance action     |
| npm run redeem-stable               | Redeem DoC or Rdoc depend of the environment  |       |
| npm run mint-riskpro                | Mint BPro or RIFP depend of the environment   |  In rdoc environment before make allowance action     |
| npm run redeem-riskpro              | Redeem BPro or RIFP depend of the environment |       |
| npm run mint-riskprox               | Mint BTCx or RIFx depend of the environment   |  In rdoc environment before make allowance action     |
| npm run redeem-riskprox             | Redeem BTCx or RIFx depend of the environment |  In rdoc environment before make allowance action     |
| npm run allowance-use-reserve-token | Allowance to use Reserve Token in MoC         |                                                       |




Example:

`npm run mint-stable`


Result:

```
npm run mint-stable

> moneyonchain-example-integration@1.0.0 mint-doc example-moc-integration-js
> node src/mintDoc.js

Read json path:  ./config.json
Read json path:  ./abis/MoC/Multicall2.json
Read json path:  ./abis/MoC/MoCConnector.json
Read json path:  ./abis/MoC/MoC.json
Read json path:  ./abis/MoC/MoCState.json
Read json path:  ./abis/MoC/MoCExchange.json
Read json path:  ./abis/MoC/MoCInrate.json
Read json path:  ./abis/MoC/MoCSettlement.json
Read json path:  ./abis/MoC/DocToken.json
Read json path:  ./abis/MoC/BProToken.json
Read json path:  ./abis/MoC/MoCToken.json
Reading Multicall2 Contract... address:  0xaf7be1ef9537018feda5397d9e3bb9a1e4e27ac8
Reading MoC Contract... address:  0x2820f6d4D199B8D8838A4B26F9917754B86a0c1F
Reading MoCConnector... address:  0xABB405e01Da6212E2d6fc87bbc460c73201cF6b0
Reading MoC State Contract... address:  0x0adb40132cB0ffcEf6ED81c26A1881e214100555
Reading MoC Inrate Contract... address:  0x76790f846FAAf44cf1B2D717d0A6c5f6f5152B60
Reading MoC Exchange Contract... address:  0xc03Ac60eBbc01A1f4e9b5bb989F359e5D8348919
Reading MoC Settlement  Contract... address:  0x367D283c53f8F10e47424e2AeB102F45eCC49FEa
Reading DoC Token Contract... address:  0xCB46c0ddc60D18eFEB0E586C17Af6ea36452Dae0
Reading BPro Token Contract... address:  0x4dA7997A819bb46B6758B9102234c289dD2Ad3bf
Reading MoC Token Contract... address:  0x45a97b54021a3F99827641AFe1BFAE574431e6ab
Reading contract status ...

Contract Status

Bitcoin Price: 41567 USD
Bitcoin EMA Price: 43330.915286350271786074 USD
MoC Price: 0.5 USD
BPRO Available to redeem: 18.037329764239672237 BPRO
BTCx Available to mint: 13.04979800328963692 BTCX
DOC Available to mint: 341610.095131173373764918 DOC
DOC Available to redeem: 597239.665378156881055738 DOC
BPRO Leverage: 1.212030995721363853 
BPRO Target Coverage: 1.212030995721363853 
Total BTC in contract: 82.135385663867041857 
Total BTC inrate Bag: 0.000002208138978736 
Global Coverage: 5.715746437064463768 
BTCx Coverage: 1.81649339468865932 
BTCx Leverage: 2.224749650768839825 
BPRO Price: 56817.184072629267237107 USD
BTCx Price: 0.898977554309916258 RBTC
Contract State: 3 
Contract Paused: false 
Contract Protected: 1500000000000000000 
    
Reading user balance ... account: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
User Balance: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3


User: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
RBTC Balance: 0.201533562645013191 RBTC
DOC Balance: 2154.703606722461151689 DOC
BPRO Balance: 0.288934837385832226 BPRO
BTCX Balance: 0 BTCX
MOC Balance: 12129.697307220654501775 MOC
MOC Allowance: 0 MOC
DOC queue to redeem: 0 DOC
    
Paying commission with RBTC: 3.60863184736e-7 RBTC
To mint 10 DOC you need > 0.00024093631967666469 RBTC in your balance
Please wait... sending transaction... Wait until blockchain mine transaction!

Event: StableTokenMint

account: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
amount: 9.902073760434931883
reserveTotal: 0.000240575456491928
commission: 240575456491
reservePrice: 41159.95
mocCommissionValue: 0
mocPrice: 0.5
btcMarkup: 120287728245
mocMarkup: 0
vendorAccount: 0xf69287f5ca3cc3c6d3981f2412109110cb8af076
Transaction hash: 0x0f49e74eec96aae871cf3766a1840d0fc01c4e7880ab7c6054d9e1fa9dc98930

```
