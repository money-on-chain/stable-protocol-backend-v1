# Money on Chain Integration for V1 Contracts

## Warning: This is only for version 1 of the main contracts.
## Warning: RoC Project now has version 2 of the contract use this repo instead: [https://github.com/money-on-chain/stable-protocol-backend-v2](https://github.com/money-on-chain/stable-protocol-backend-v2) 

Money on chain token operations with multi collateral (coinbase or RRC20).

* Mint / Redeem Pegged Token (TP): Ex.: DoC
* Mint / Redeem Collateral Token (TC): Ex.: BPro or RIFP
* Mint / Redeem Token X (TX): Ex.: BTCx (Disabled)
* Enable / Disable Paying Commissions with Govern Token (TG): Ex.: MOC
* Status of Main MoC Contracts
* Admin: Vendor information
* Admin: Vendor add stake
* Admin: Vendor remove stake
* "Governanza" operations

**Tokens**

Note: TX Token is not available anymore.

| Token   | Name             | Ex.   |                           |
|---------|------------------|-------|---------------------------|
| TP      | Token Pegged     | DOC   | Pegged token 1:1 with USD |
| TC      | Collateral Token | BPRO  | HODL + Earn Token         |
| TX (NA) | Token X          | BTCX  | Leveraged long position   |
| TG      | Govern Token     | MOC   | Govern + Stake token      |


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
OPERATION_AMOUNT_MINT_TP=10
OPERATION_AMOUNT_REDEEM_TP=10
OPERATION_AMOUNT_MINT_TC=0.0001
OPERATION_AMOUNT_REDEEM_TC=0.0001
OPERATION_AMOUNT_MINT_TX=0.0001
OPERATION_AMOUNT_REDEEM_TX=0.00001
MINT_SLIPPAGE=0.2
ADMIN_VENDORS_ADD_STAKE_AMOUNT=10
ADMIN_VENDORS_REMOVE_STAKE_AMOUNT=10
```

#### Money on Chain projects and tokens 

| Token   | Token name       | Project | Token Name | Collateral |
|---------|------------------|---------|------------|------------|
| TP      | Pegged Token 1:1 | MOC     | DOC        | RBTC       |
| TC      | Collateral Token | MOC     | BPRO       | RBTC       |
| TX (NA) | Leverage Token X | MOC     | BTCX       | RBTC       |
| TG      | Govern Token     | MOC     | MOC        | -          |


#### Environment table

Environment is our already deployed contracts. For example **mocMainnet2** is our MOC current production environment.

| Network Name      | Project | Environment           | Network    |
|-------------------|---------|-----------------------|------------|
| mocTestnetAlpha   | MOC     |                       | Testnet    |
| mocTestnet        | MOC     | -                     | Testnet    |
| mocMainnet2       | MOC     | dapp.moneyonchain.com | Mainnet    |

### Faucets

In testnet you may need some test tRIF o tRBTC

* **Faucet tRBTC**: https://faucet.rsk.co/
* **Faucet tRIF**: https://faucet.rifos.org/



### How to run scripts


| Command                                        | Action                                | Obs | 
|------------------------------------------------|---------------------------------------|-----|
| node scripts/moc-v1/commission-tg-enable.js    | Enable paying commission MoC          |     |
| node scripts/moc-v1/commission-tg-disable.js   | Disable paying commission MoC         |     |
| node scripts/moc-v1/tp-mint.js                 | Mint DoC                              |     |
| node scripts/moc-v1/tp-redeem.js               | Redeem DoC                            |     |
| node scripts/moc-v1/tc-mint.js                 | Mint BPro                             |     |
| node scripts/moc-v1/tc-redeem.js               | Redeem BPro                           |     |
| node scripts/moc-v1/allowance-reserve-token.js | Allowance to use Reserve Token in MoC |     |

Example Contract status:

`node scripts/moc-v1/contract-status.js`

Result:

```
node scripts/moc-v1/contract-status.js

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


Example Mint Pegged Token:

`node scripts/moc-v1/tp-mint.js `

Result:

```
node scripts/moc-v1/tp-mint.js 
Reading Multicall2 Contract... address:  0xaf7be1ef9537018feda5397d9e3bb9a1e4e27ac8
Reading MoC Contract... address:  0x2820f6d4D199B8D8838A4B26F9917754B86a0c1F
Reading MoCConnector... address:  0xABB405e01Da6212E2d6fc87bbc460c73201cF6b0
Reading MoC State Contract... address:  0x0adb40132cB0ffcEf6ED81c26A1881e214100555
Reading MoC Inrate Contract... address:  0x76790f846FAAf44cf1B2D717d0A6c5f6f5152B60
Reading MoC Exchange Contract... address:  0xc03Ac60eBbc01A1f4e9b5bb989F359e5D8348919
Reading MoC Settlement  Contract... address:  0x367D283c53f8F10e47424e2AeB102F45eCC49FEa
Reading DOC Token Contract... address:  0xCB46c0ddc60D18eFEB0E586C17Af6ea36452Dae0
Reading BPRO Token Contract... address:  0x4dA7997A819bb46B6758B9102234c289dD2Ad3bf
Reading MOC Token Contract... address:  0x45a97b54021a3F99827641AFe1BFAE574431e6ab
Reading MoC Vendors Contract... address:  0x84b895A1b7be8fAc64d43757479281Bf0b5E3719
Reading contract status ...
Contract Status


RBTC Price: 20589.14 USD
RBTC EMA Price: 21889.656344189960467318 USD
MOC Price: 0.5 USD
BPRO Available to redeem: 14.595636140134689731 BPRO
BTCX Available to mint: 30.332701472969623252 BTCX
DOC Available to mint: 105278.82362137741582602 DOC
DOC Available to redeem: 584116.832264976018166095 DOC
BPRO Leverage: 1.282305051914530634
BPRO Target Coverage: 1.282305051914530634
Total RBTC in contract: 128.896348936219223067 
Total RBTC inrate Bag: 0.000033364465093186 
Global Coverage: 4.540426724778309605 
BTCX Coverage: 2.138353845354938639
BTCX Leverage: 1.87846147670208825
BPRO Price: 21639.102799750781025749 USD
BTCX Price: 1.064701099705964054 RBTC
Contract State: 3 
Contract Paused: false 
Contract Protected: 1500000000000000000 
    
Reading user balance ... account: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3


User: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
RBTC Balance: 0.128883811086135203 RBTC
DOC Balance: 4010.341130829353720593 DOC
BPRO Balance: 41.982780218139322315 BPRO
BTCX Balance: 0.007169287509122712 BTCX
MOC Balance: 31358.889479611078575745 MOC
MOC Allowance: 9007199254740991 MOC
DOC queue to redeem: 0 DOC
    
Paying commission with MOC Tokens: 0.01999999999997211784 MOC
Mint Slippage using 0.2 %. Slippage amount: 9.713858859573542e-7 Total to send: 0.0004866643288646344542
To mint 10 DOC you need > 0.0004866643288646344542 RBTC in your balance
Please wait... sending transaction... Wait until blockchain mine transaction!

Event: Transfer

from: 0x0000000000000000000000000000000000000000
to: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
value: 9.989926728362620006

Event: StableTokenMint

account: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
amount: 9.989926728362620006
reserveTotal: 0.000485692942978677
commission: 0
reservePrice: 20568.4
mocCommissionValue: 0.009989926728348695
mocPrice: 0.5
btcMarkup: 0
mocMarkup: 0.009989926728348695
vendorAccount: 0xf69287f5ca3cc3c6d3981f2412109110cb8af076

Event: VendorReceivedMarkup

vendorAdress: 0xf69287f5ca3cc3c6d3981f2412109110cb8af076
paidMoC: 0.009989926728348695
paidRBTC: 0

Event: Transfer

from: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
to: 0xf69287f5ca3cc3c6d3981f2412109110cb8af076
value: 0.009989926728348695

Event: Approval

owner: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
spender: 0x2820f6d4d199b8d8838a4b26f9917754b86a0c1f
value: 9007199254740990.990010073271651305

Event: Transfer

from: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
to: 0xc003a2e210fa3e2fbddcf564fe0e1bbcd93e3b40
value: 0.009989926728348695

Event: Approval

owner: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
spender: 0x2820f6d4d199b8d8838a4b26f9917754b86a0c1f
value: 9007199254740990.98002014654330261
Transaction hash: 0x26223b391eecbb7576a7ba031b9dbaf8e0559097727371eeb7063b1de22c130f

```


### Vendors

To start using protocol as vendor in V1 of the contract protocol:

1) You need to be added as a vendor, please contact MoC Team and give the address of an account you control and the markup you want to use. For example: 0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3 and markup like 0.1%
2) After added your account as vendor, you need to stake MoC in the same amount you want to receive as a collection of fee markup.

**Stake MoC in Vendors**

Please fill in .env you user address, PK and vendor (the same as user address): (replace the example) from the account you added as vendor 

```
USER_ADDRESS=0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3
USER_PK=...
VENDOR_ADDRESS=0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3
```

also fill the amount to stake:

```
ADMIN_VENDORS_ADD_STAKE_AMOUNT=1000
```

Run the script to know information about staking account

`node scripts/moc-v1/admin-vendor-info.js`

Result

```
Vendor Account: 0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3
Is Active: true
Markup: 0.001
Total Paid in MOC: 0
Staking: 0
```

Now you need to make and allowance to use MoC in Vendor Contract

`node scripts/moc-v1/admin-vendor-allowance.js`

Result:

```
Please wait... sending transaction... Wait until blockchain mine transaction!

Event: Approval

owner: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
spender: 0x84b895a1b7be8fac64d43757479281bf0b5e3719
value: 9007199254740991
Transaction hash: 0xbd478b28bb8d7ee01ce242a839d94191f37665f3776a7e57ff0af6723ddeac5b
```

Then you have to run the transaction to add stake:

`node scripts/moc-v1/admin-vendor-add-stake.js`

Result:

```
Please wait... sending transaction... Wait until blockchain mine transaction!

Event: Transfer

from: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
to: 0x84b895a1b7be8fac64d43757479281bf0b5e3719
value: 10

Event: Approval

owner: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
spender: 0x84b895a1b7be8fac64d43757479281bf0b5e3719
value: 9007199254740981

Event: VendorStakeAdded

account: 0xcd8a1c9acc980ae031456573e34dc05cd7dae6e3
staking: 10
Transaction hash: 0xe1b4a8d2c95b1dccdade06400425ea1de697b01361b2fe773fcde831685e6ea5
```

Verify the information:


`node scripts/moc-v1/admin-vendor-info.js`

Result:

```
Vendor Account: 0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3
Is Active: true
Markup: 0.001
Total Paid in MOC: 0
Staking: 10
```