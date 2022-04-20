# Money on Chain Integration - Nodejs

Code example verification of Money on chain operations

### Setup

1. `npm install`
2. Clone `.env.mocTestnet` and save it as `.env`
3. Fill in wallet address and private key (it needs some testnet RBTC) in that file.


```
USER_ADDRESS=
USER_PK=
HOST_URI=https://public-node.testnet.rsk.co
MOC_ENVIRONMENT=mocTestnet
MOC_PROJECT=MoC
VENDOR_ADDRESS=0xf69287F5Ca3cC3C6d3981f2412109110cB8af076
GAS_MULTIPLIER=2
OPERATION_AMOUNT_MINT_DOC=10
```


### How to run

`npm run mint-doc`


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
