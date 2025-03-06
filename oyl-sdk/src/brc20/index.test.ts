import { walletInit } from '../signer/signer'
import {
  Account,
  GatheredUtxos,
  Provider,
  Signer,
  brc20,
  createInscriptionScript,
  getWalletPrivateKeys,
  mnemonicToAccount,
  tweakSigner,
} from '..'
import * as bitcoin from 'bitcoinjs-lib'
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371'

const account: Account = mnemonicToAccount({
  mnemonic:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  opts: { index: 0, network: bitcoin.networks.regtest },
})
const account1: Account = mnemonicToAccount({
  mnemonic:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  opts: { index: 1, network: bitcoin.networks.regtest },
})

const provider = new Provider({
  url: '',
  projectId: '',
  network: bitcoin.networks.regtest,
  networkType: 'mainnet',
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

const tweakedTaprootPublicKey = toXOnly(tweakedTaprootKeyPair.publicKey)
const content = `{"p":"brc-20","op":"transfer","tick":"toyl","amt":"100"}`
const script = createInscriptionScript(tweakedTaprootPublicKey, content)
const outputScript = bitcoin.script.compile(script)

const p2pk_redeem = { output: outputScript }

const { output } = bitcoin.payments.p2tr({
  internalPubkey: toXOnly(tweakedTaprootKeyPair.publicKey),
  scriptTree: p2pk_redeem,
  redeem: p2pk_redeem,
  network: provider.network,
})

const testFormattedUtxos: GatheredUtxos = {
  utxos: [
    {
      txId: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b274',
      outputIndex: 0,
      satoshis: 100000,
      confirmations: 3,
      scriptPk: outputScript.toString('hex'),
      address: account.taproot.address,
      inscriptions: [],
    },
    {
      txId: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b275',
      outputIndex: 0,
      satoshis: 100000,
      confirmations: 3,
      scriptPk: output!.toString('hex'),
      address: account.taproot.address,
      inscriptions: [],
    },
  ],
  totalAmount: 200000,
}

jest
  .spyOn(require('../shared/utils'), 'getOutputValueByVOutIndex')
  .mockResolvedValue({
    value: 100000,
    script: testFormattedUtxos.utxos[0].scriptPk,
  })

jest.spyOn(provider.sandshrew, 'multiCall').mockResolvedValue([
  {
    result: {
      txid: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b276',
      version: 2,
      locktime: 0,
      vin: [],
      vout: [
        {
          scriptpubkey: outputScript.toString('hex'),
          scriptpubkey_address: account.taproot.address,
          value: testFormattedUtxos.utxos[0].satoshis,
        },
      ],
      size: 223,
      weight: 562,
      fee: 452,
      status: false,
    },
  },
  {
    result: {
      txid: '72e22e25fa587c01cbd0a86a5727090c9cdf12e47126c99e35b24185c395b277',
      version: 2,
      locktime: 0,
      vin: [],
      vout: [
        {
          scriptpubkey: outputScript.toString('hex'),
          scriptpubkey_address: account.taproot.address,
          value: 546,
        },
      ],
      size: 223,
      weight: 562,
      fee: 452,
      status: false,
    },
  },
])

describe('brc20', () => {
  it('transferEstimate', async () => {
    const result = await brc20.transferEstimate({
      gatheredUtxos: testFormattedUtxos,
      toAddress: account1.taproot.address,
      feeRate: 3,
      account,
      provider,
    })
    expect(result.psbt).toBeDefined()
    expect(result.fee).toBeDefined()
  })
  it('commit', async () => {
    const result = await brc20.commit({
      tweakedTaprootPublicKey,
      gatheredUtxos: testFormattedUtxos,
      amount: 100,
      ticker: 'toyl',
      feeRate: 3,
      account,
      provider,
      finalTransferFee: 654,
    })
    expect(result.psbt).toBeDefined()
    expect(result.script).toBeDefined()
    expect(result.fee).toBeDefined()
  })

  it('reveal', async () => {
    const result = await brc20.reveal({
      receiverAddress: account.taproot.address,
      tweakedTaprootKeyPair,
      commitTxId: testFormattedUtxos.utxos[0].txId,
      script: outputScript,
      feeRate: 3,
      provider,
    })
    expect(result.psbt).toBeDefined()
    expect(result.psbtHex).toBeDefined()
    expect(result.fee).toBeDefined()
  })
  it('transfer', async () => {
    const result = await brc20.transfer({
      commitChangeUtxoId: testFormattedUtxos.utxos[0].txId,
      revealTxId: testFormattedUtxos.utxos[1].txId,
      toAddress: account1.taproot.address,
      feeRate: 3,
      account,
      provider,
    })
    expect(result.psbt).toBeDefined()
  })
  // it('send', async () => {
  //   const result = await brc20.send({
  //     gatheredUtxos: testFormattedUtxos,
  //     toAddress:
  //       'bc1pklamaklxrdgm7njpudghhq3j7vwxfuak0l7jmrhvluf0cld5etjsga00nj',
  //     amount: 100,
  //     ticker: 'toyl',
  //     feeRate: 3,
  //     account,
  //     provider,
  //     signer,
  //   })
  // expect(result.utxos).toEqual(testFormattedUtxos)
  // expect(result.totalAmount).toEqual(150000)
  //})
})
