import * as bitcoin from 'bitcoinjs-lib'
import {
  createEtchCommit,
  createEtchReveal,
  createMintPsbt,
  createSendPsbt,
} from '../rune'
import {
  Account,
  getWalletPrivateKeys,
  mnemonicToAccount,
} from '../account/account'
import { Provider } from '../provider/provider'
import { FormattedUtxo } from '../utxo/utxo'
import { RuneUTXO, tweakSigner } from '..'
import { Signer, walletInit } from '../signer/signer'

const provider = new Provider({
  url: '',
  projectId: '',
  network: bitcoin.networks.regtest,
  networkType: 'mainnet',
})

const account: Account = mnemonicToAccount({
  mnemonic:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  opts: { index: 0, network: bitcoin.networks.regtest },
})

const privateKeys = getWalletPrivateKeys({
  mnemonic:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  opts: { index: 0, network: bitcoin.networks.regtest },
})

const keys: walletInit = {
  legacyPrivateKey: privateKeys.legacy.privateKey,
  segwitPrivateKey: privateKeys.nativeSegwit.privateKey,
  nestedSegwitPrivateKey: privateKeys.nestedSegwit.privateKey,
  taprootPrivateKey: privateKeys.taproot.privateKey,
}

const signer: Signer = new Signer(bitcoin.networks.regtest, keys)
const tweakedTaprootKeyPair: bitcoin.Signer = tweakSigner(
  signer.taprootKeyPair,
  { network: provider.network }
)

const { address } = bitcoin.payments.p2wpkh({
  pubkey: Buffer.from(account.nativeSegwit.pubkey, 'hex'),
  network: bitcoin.networks.regtest,
})
const { output } = bitcoin.payments.p2wpkh({
  address,
  network: bitcoin.networks.regtest,
})
const scriptPk = output!.toString('hex')

const testFormattedUtxos: FormattedUtxo[] = [
  {
    txId: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b274',
    outputIndex: 0,
    satoshis: 100000,
    confirmations: 3,
    scriptPk,
    address: account.taproot.address,
    inscriptions: [],
  },
  {
    txId: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b275',
    outputIndex: 0,
    satoshis: 100000,
    confirmations: 3,
    scriptPk,
    address: account.nativeSegwit.address,
    inscriptions: [],
  },
]

const runeUtxos: RuneUTXO[] = [
  {
    txId: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b276',
    txIndex: '0',
    satoshis: 10000,
    amountOfRunes: 500,
    script: scriptPk,
    address: account.taproot.address,
  },
  {
    txId: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b277',
    txIndex: '0',
    satoshis: 3333,
    amountOfRunes: 1000,
    script: scriptPk,
    address: account.nativeSegwit.address,
  },
]

jest.spyOn(require('../rune/rune'), 'findRuneUtxos').mockResolvedValue({
  runeUtxos,
  runeTotalSatoshis: 103333,
  divisibility: 3,
})

jest
  .spyOn(require('../shared/utils'), 'getOutputValueByVOutIndex')
  .mockResolvedValue({
    value: 100000,
    script: account.taproot.pubkey,
  })

let revealScript: Buffer

describe('rune txs', () => {
  it('rune send tx', async () => {
    const { psbt } = await createSendPsbt({
      gatheredUtxos: {
        utxos: testFormattedUtxos,
        totalAmount: 200000,
      },
      toAddress: address!,
      amount: 3000,
      feeRate: 10,
      account,
      provider: provider,
      runeId: '30003:1',
      inscriptionAddress: account.taproot.address,
    })

    expect(psbt).toEqual(
      'cHNidP8BAP0GAQIAAAADdrKVw4VBsjWeySZx5BLfnAwJJ1dqqNDLAXxY+iUu4nIAAAAAAP////93spXDhUGyNZ7JJnHkEt+cDAknV2qo0MsBfFj6JS7icgAAAAAA/////3SylcOFQbI1nskmceQS35wMCSdXaqjQywF8WPolLuJyAAAAAAD/////BAAAAAAAAAAAD2pdDBYBALPqAQHAjbcBAiICAAAAAAAAIlEgpghp8NvPHcZZyc7Lr4BQE16p6M3EhwU/HcaICUncaEylkwEAAAAAABYAFMDOvNbD08qMddxexi6+VTMO+RDianoBAAAAAAAWABTAzrzWw9PKjHXcXsYuvlUzDvkQ4gAAAAAAAQEfECcAAAAAAAAWABTAzrzWw9PKjHXcXsYuvlUzDvkQ4gABAR8FDQAAAAAAABYAFMDOvNbD08qMddxexi6+VTMO+RDiAAEBH6CGAQAAAAAAFgAUwM681sPTyox13F7GLr5VMw75EOIAAAAAAA=='
    )
  })

  it('rune mint tx', async () => {
    const { psbt } = await createMintPsbt({
      gatheredUtxos: {
        utxos: testFormattedUtxos,
        totalAmount: 200000,
      },
      feeRate: 10,
      account,
      provider: provider,
      runeId: '30003:1',
    })

    expect(psbt).toEqual(
      'cHNidP8BAJECAAAAAXSylcOFQbI1nskmceQS35wMCSdXaqjQywF8WPolLuJyAAAAAAD/////AwAAAAAAAAAAC2pdCBSz6gEUARYBIgIAAAAAAAAiUSCmCGnw288dxlnJzsuvgFATXqnozcSHBT8dxogJSdxoTPp7AQAAAAAAFgAUwM681sPTyox13F7GLr5VMw75EOIAAAAAAAEBH6CGAQAAAAAAFgAUwM681sPTyox13F7GLr5VMw75EOIAAAAA'
    )
  })

  it('rune etch commit', async () => {
    const { psbt, script } = await createEtchCommit({
      gatheredUtxos: {
        utxos: testFormattedUtxos,
        totalAmount: 200000,
      },
      taprootKeyPair: signer.taprootKeyPair,
      tweakedTaprootKeyPair,
      feeRate: 10,
      account,
      provider: provider,
      runeName: 'TESTRUNE',
    })

    revealScript = script

    expect(psbt).toEqual(
      'cHNidP8BAH0CAAAAAXSylcOFQbI1nskmceQS35wMCSdXaqjQywF8WPolLuJyAAAAAAD/////AqYKAAAAAAAAIlEgAQJDmRbEnUdH5/iwTc+V3fGETzdxZKTn28wyvFNpHMh2cwEAAAAAABYAFMDOvNbD08qMddxexi6+VTMO+RDiAAAAAAABAR+ghgEAAAAAABYAFMDOvNbD08qMddxexi6+VTMO+RDiAAAA'
    )
  })

  it('rune etch reveal', async () => {
    const { psbt } = await createEtchReveal({
      symbol: 'T',
      cap: BigInt(1000),
      premine: BigInt(3),
      perMintAmount: BigInt(10),
      turbo: false,
      divisibility: 3,
      runeName: 'TESTRUNE',
      receiverAddress: account.taproot.address,
      script: revealScript,
      tweakedTaprootKeyPair,
      provider,
      commitTxId:
        '9704ae7884958e6dcc621d227937816098713669396c65215e9bfa58301fcb75',
      feeRate: 10,
    })

    expect(psbt).toEqual(
      'cHNidP8BAIACAAAAAXXLHzBY+pteIWVsOWk2cZhggTd5Ih1izG2OlYR4rgSXAAAAAAD/////AgAAAAAAAAAAGWpdFgIDBJTw/YXdBAEDBVQGAwoKCOgHFgEiAgAAAAAAACJRIKYIafDbzx3GWcnOy6+AUBNeqejNxIcFPx3GiAlJ3GhMAAAAAAABASughgEAAAAAACJRIAECQ5kWxJ1HR+f4sE3Pld3xhE83cWSk59vMMrxTaRzIAQiQA0CBmBAJeGh5aksE1o8p+7r4XZWOFn920ddFzYlMHFB2VSIw2XM0mNxlwAtyX0K8y2DSYbkSqN3/QLPE0zzSXDtMKyCmCGnw288dxlnJzsuvgFATXqnozcSHBT8dxogJSdxoTKwAYwUUeL/QJWghwaYIafDbzx3GWcnOy6+AUBNeqejNxIcFPx3GiAlJ3GhMAAAA'
    )
  })
})
