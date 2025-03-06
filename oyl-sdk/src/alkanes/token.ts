import { minimumFee } from '../btc'
import { u128, u32 } from '@magiceden-oss/runestone-lib/dist/src/integer'
import { Account, Signer, Provider } from '..'
import { ProtoStone, encodeRunestoneProtostone } from 'alkanes/lib/index.js'
import { ProtoruneRuneId } from 'alkanes/lib/protorune/protoruneruneid'
import { OylTransactionError } from '../errors'
import { AlkaneId, AlkanesPayload, GatheredUtxos } from '../shared/interface'
import * as bitcoin from 'bitcoinjs-lib'
import {
  timeout,
  findXAmountOfSats,
  inscriptionSats,
  formatInputsToSign,
  getAddressType,
} from '../shared/utils'
import { deployCommit, executeReveal, findAlkaneUtxos } from './alkanes'

export const tokenDeployment = async ({
  payload,
  gatheredUtxos,
  account,
  protostone,
  provider,
  feeRate,
  signer,
}: {
  payload: AlkanesPayload
  gatheredUtxos: GatheredUtxos
  account: Account
  protostone: Buffer
  provider: Provider
  feeRate?: number
  signer: Signer
}) => {
  const { script, txId } = await deployCommit({
    payload,
    gatheredUtxos,
    account,
    provider,
    feeRate,
    signer,
  })

  await timeout(3000)

  const reveal = await executeReveal({
    protostone,
    script,
    commitTxId: txId,
    account,
    provider,
    feeRate,
    signer,
  })

  return { ...reveal, commitTx: txId }
}
export const createSendPsbt = async ({
  gatheredUtxos,
  account,
  alkaneId,
  provider,
  toAddress,
  amount,
  feeRate,
  fee,
}: {
  gatheredUtxos: GatheredUtxos
  account: Account
  alkaneId: { block: string; tx: string }
  provider: Provider
  toAddress: string
  amount: number
  feeRate?: number
  fee?: number
}) => {
  try {
    const originalGatheredUtxos = gatheredUtxos

    const minFee = minimumFee({
      taprootInputCount: 2,
      nonTaprootInputCount: 0,
      outputCount: 3,
    })
    const calculatedFee = minFee * feeRate < 250 ? 250 : minFee * feeRate
    let finalFee = fee ? fee : calculatedFee

    gatheredUtxos = findXAmountOfSats(
      originalGatheredUtxos.utxos,
      Number(finalFee) + Number(inscriptionSats)
    )

    if (gatheredUtxos.utxos.length > 1) {
      const txSize = minimumFee({
        taprootInputCount: gatheredUtxos.utxos.length,
        nonTaprootInputCount: 0,
        outputCount: 3,
      })

      finalFee = Math.max(txSize * feeRate, 250)
      gatheredUtxos = findXAmountOfSats(
        originalGatheredUtxos.utxos,
        Number(finalFee) + Number(inscriptionSats)
      )
    }

    let psbt = new bitcoin.Psbt({ network: provider.network })
    const { alkaneUtxos, totalSatoshis } = await findAlkaneUtxos({
      address: account.taproot.address,
      greatestToLeast: account.spendStrategy.utxoSortGreatestToLeast,
      alkaneId,
      provider,
      targetNumberOfAlkanes: amount,
    })

    if (alkaneUtxos.length === 0) {
      throw new OylTransactionError(Error('No Alkane Utxos Found'))
    }

    for await (const utxo of alkaneUtxos) {
      if (getAddressType(utxo.address) === 0) {
        const previousTxHex: string = await provider.esplora.getTxHex(utxo.txId)
        psbt.addInput({
          hash: utxo.txId,
          index: parseInt(utxo.txIndex),
          nonWitnessUtxo: Buffer.from(previousTxHex, 'hex'),
        })
      }
      if (getAddressType(utxo.address) === 2) {
        const redeemScript = bitcoin.script.compile([
          bitcoin.opcodes.OP_0,
          bitcoin.crypto.hash160(
            Buffer.from(account.nestedSegwit.pubkey, 'hex')
          ),
        ])

        psbt.addInput({
          hash: utxo.txId,
          index: parseInt(utxo.txIndex),
          redeemScript: redeemScript,
          witnessUtxo: {
            value: utxo.satoshis,
            script: bitcoin.script.compile([
              bitcoin.opcodes.OP_HASH160,
              bitcoin.crypto.hash160(redeemScript),
              bitcoin.opcodes.OP_EQUAL,
            ]),
          },
        })
      }
      if (
        getAddressType(utxo.address) === 1 ||
        getAddressType(utxo.address) === 3
      ) {
        psbt.addInput({
          hash: utxo.txId,
          index: parseInt(utxo.txIndex),
          witnessUtxo: {
            value: utxo.satoshis,
            script: Buffer.from(utxo.script, 'hex'),
          },
        })
      }
    }

    if (gatheredUtxos.totalAmount < finalFee + inscriptionSats * 2) {
      throw new OylTransactionError(Error('Insufficient Balance'))
    }

    for (let i = 0; i < gatheredUtxos.utxos.length; i++) {
      if (getAddressType(gatheredUtxos.utxos[i].address) === 0) {
        const previousTxHex: string = await provider.esplora.getTxHex(
          gatheredUtxos.utxos[i].txId
        )
        psbt.addInput({
          hash: gatheredUtxos.utxos[i].txId,
          index: gatheredUtxos.utxos[i].outputIndex,
          nonWitnessUtxo: Buffer.from(previousTxHex, 'hex'),
        })
      }
      if (getAddressType(gatheredUtxos.utxos[i].address) === 2) {
        const redeemScript = bitcoin.script.compile([
          bitcoin.opcodes.OP_0,
          bitcoin.crypto.hash160(
            Buffer.from(account.nestedSegwit.pubkey, 'hex')
          ),
        ])

        psbt.addInput({
          hash: gatheredUtxos.utxos[i].txId,
          index: gatheredUtxos.utxos[i].outputIndex,
          redeemScript: redeemScript,
          witnessUtxo: {
            value: gatheredUtxos.utxos[i].satoshis,
            script: bitcoin.script.compile([
              bitcoin.opcodes.OP_HASH160,
              bitcoin.crypto.hash160(redeemScript),
              bitcoin.opcodes.OP_EQUAL,
            ]),
          },
        })
      }
      if (
        getAddressType(gatheredUtxos.utxos[i].address) === 1 ||
        getAddressType(gatheredUtxos.utxos[i].address) === 3
      ) {
        psbt.addInput({
          hash: gatheredUtxos.utxos[i].txId,
          index: gatheredUtxos.utxos[i].outputIndex,
          witnessUtxo: {
            value: gatheredUtxos.utxos[i].satoshis,
            script: Buffer.from(gatheredUtxos.utxos[i].scriptPk, 'hex'),
          },
        })
      }
    }

    const protostone = encodeRunestoneProtostone({
      protostones: [
        ProtoStone.message({
          protocolTag: 1n,
          edicts: [
            {
              id: new ProtoruneRuneId(
                u128(BigInt(alkaneId.block)),
                u128(BigInt(alkaneId.tx))
              ),
              amount: u128(BigInt(amount)),
              output: u32(BigInt(1)),
            },
          ],
          pointer: 0,
          refundPointer: 0,
          calldata: Buffer.from([]),
        }),
      ],
    }).encodedRunestone

    psbt.addOutput({
      value: inscriptionSats,
      address: account.taproot.address,
    })

    psbt.addOutput({
      value: inscriptionSats,
      address: toAddress,
    })

    const output = { script: protostone, value: 0 }

    psbt.addOutput(output)
    const changeAmount =
      gatheredUtxos.totalAmount +
      totalSatoshis -
      (finalFee + inscriptionSats * 2)

    psbt.addOutput({
      address: account[account.spendStrategy.changeAddress].address,
      value: changeAmount,
    })

    const formattedPsbtTx = await formatInputsToSign({
      _psbt: psbt,
      senderPublicKey: account.taproot.pubkey,
      network: provider.network,
    })

    return { psbt: formattedPsbtTx.toBase64() }
  } catch (error) {
    throw new OylTransactionError(error)
  }
}

export const send = async ({
  gatheredUtxos,
  toAddress,
  amount,
  alkaneId,
  feeRate,
  account,
  provider,
  signer,
}: {
  gatheredUtxos: GatheredUtxos
  toAddress: string
  amount: number
  alkaneId: AlkaneId
  feeRate?: number
  account: Account
  provider: Provider
  signer: Signer
}) => {
  const { fee } = await actualSendFee({
    gatheredUtxos,
    account,
    alkaneId,
    amount,
    provider,
    toAddress,
    feeRate,
    signer,
  })

  const { psbt: finalPsbt } = await createSendPsbt({
    gatheredUtxos,
    account,
    alkaneId,
    amount,
    provider,
    toAddress,
    feeRate,
    fee,
  })

  const { signedPsbt } = await signer.signAllInputs({
    rawPsbt: finalPsbt,
    finalize: true,
  })

  const result = await provider.pushPsbt({
    psbtBase64: signedPsbt,
  })

  return result
}

export const actualSendFee = async ({
  gatheredUtxos,
  account,
  alkaneId,
  provider,
  toAddress,
  amount,
  feeRate,
  signer,
}: {
  gatheredUtxos: GatheredUtxos
  account: Account
  alkaneId: { block: string; tx: string }
  provider: Provider
  toAddress: string
  amount: number
  feeRate?: number
  signer: Signer
}) => {
  if (!feeRate) {
    feeRate = (await provider.esplora.getFeeEstimates())['1']
  }

  const { psbt } = await createSendPsbt({
    gatheredUtxos,
    account,
    alkaneId,
    provider,
    toAddress,
    amount,
    feeRate,
  })

  const { signedPsbt } = await signer.signAllInputs({
    rawPsbt: psbt,
    finalize: true,
  })

  let rawPsbt = bitcoin.Psbt.fromBase64(signedPsbt, {
    network: account.network,
  })

  const signedHexPsbt = rawPsbt.extractTransaction().toHex()

  const vsize = (
    await provider.sandshrew.bitcoindRpc.testMemPoolAccept([signedHexPsbt])
  )[0].vsize

  const correctFee = vsize * feeRate

  const { psbt: finalPsbt } = await createSendPsbt({
    gatheredUtxos,
    account,
    alkaneId,
    provider,
    toAddress,
    amount,
    feeRate,
    fee: correctFee,
  })

  const { signedPsbt: signedAll } = await signer.signAllInputs({
    rawPsbt: finalPsbt,
    finalize: true,
  })

  let finalRawPsbt = bitcoin.Psbt.fromBase64(signedAll, {
    network: account.network,
  })

  const finalSignedHexPsbt = finalRawPsbt.extractTransaction().toHex()

  const finalVsize = (
    await provider.sandshrew.bitcoindRpc.testMemPoolAccept([finalSignedHexPsbt])
  )[0].vsize

  const finalFee = finalVsize * feeRate

  return { fee: finalFee }
}

export const split = async ({
  alkaneUtxos,
  gatheredUtxos,
  account,
  protostone,
  provider,
  feeRate,
  signer,
}: {
  alkaneUtxos?: {
    alkaneUtxos: any[]
    totalSatoshis: number
  }
  gatheredUtxos: GatheredUtxos
  account: Account
  protostone: Buffer
  provider: Provider
  feeRate?: number
  signer: Signer
}) => {
  const { fee } = await actualSplitFee({
    alkaneUtxos,
    gatheredUtxos,
    account,
    protostone,
    provider,
    feeRate,
    signer,
  })

  const { psbt: finalPsbt } = await createSplitPsbt({
    alkaneUtxos,
    gatheredUtxos,
    account,
    protostone,
    provider,
    feeRate,
    fee,
  })

  const { signedPsbt } = await signer.signAllInputs({
    rawPsbt: finalPsbt,
    finalize: true,
  })

  const revealResult = await provider.pushPsbt({
    psbtBase64: signedPsbt,
  })

  return revealResult
}

export const createSplitPsbt = async ({
  alkaneUtxos,
  gatheredUtxos,
  account,
  protostone,
  provider,
  feeRate,
  fee = 0,
}: {
  alkaneUtxos?: {
    alkaneUtxos: any[]
    totalSatoshis: number
  }
  gatheredUtxos: GatheredUtxos
  account: Account
  protostone: Buffer
  provider: Provider
  feeRate?: number
  fee?: number
}) => {
  try {
    const originalGatheredUtxos = gatheredUtxos

    const minTxSize = minimumFee({
      taprootInputCount: 2,
      nonTaprootInputCount: 0,
      outputCount: 2,
    })

    let calculatedFee = Math.max(minTxSize * feeRate, 250)
    let finalFee = fee === 0 ? calculatedFee : fee

    gatheredUtxos = findXAmountOfSats(
      originalGatheredUtxos.utxos,
      Number(finalFee) + 546 * alkaneUtxos.alkaneUtxos.length * 2
    )

    let psbt = new bitcoin.Psbt({ network: provider.network })

    if (alkaneUtxos) {
      for await (const utxo of alkaneUtxos.alkaneUtxos) {
        if (getAddressType(utxo.address) === 0) {
          const previousTxHex: string = await provider.esplora.getTxHex(
            utxo.txId
          )
          psbt.addInput({
            hash: utxo.txId,
            index: parseInt(utxo.txIndex),
            nonWitnessUtxo: Buffer.from(previousTxHex, 'hex'),
          })
        }
        if (getAddressType(utxo.address) === 2) {
          const redeemScript = bitcoin.script.compile([
            bitcoin.opcodes.OP_0,
            bitcoin.crypto.hash160(
              Buffer.from(account.nestedSegwit.pubkey, 'hex')
            ),
          ])

          psbt.addInput({
            hash: utxo.txId,
            index: parseInt(utxo.txIndex),
            redeemScript: redeemScript,
            witnessUtxo: {
              value: utxo.satoshis,
              script: bitcoin.script.compile([
                bitcoin.opcodes.OP_HASH160,
                bitcoin.crypto.hash160(redeemScript),
                bitcoin.opcodes.OP_EQUAL,
              ]),
            },
          })
        }
        if (
          getAddressType(utxo.address) === 1 ||
          getAddressType(utxo.address) === 3
        ) {
          psbt.addInput({
            hash: utxo.txId,
            index: parseInt(utxo.txIndex),
            witnessUtxo: {
              value: utxo.satoshis,
              script: Buffer.from(utxo.script, 'hex'),
            },
          })
        }
      }
    }

    if (fee === 0 && gatheredUtxos.utxos.length > 1) {
      const txSize = minimumFee({
        taprootInputCount: gatheredUtxos.utxos.length,
        nonTaprootInputCount: 0,
        outputCount: 2,
      })
      finalFee = txSize * feeRate < 250 ? 250 : txSize * feeRate

      if (gatheredUtxos.totalAmount < finalFee) {
        throw new OylTransactionError(Error('Insufficient Balance'))
      }
    }

    if (gatheredUtxos.totalAmount < finalFee) {
      throw new OylTransactionError(Error('Insufficient Balance'))
    }
    for (let i = 0; i < gatheredUtxos.utxos.length; i++) {
      if (getAddressType(gatheredUtxos.utxos[i].address) === 0) {
        const previousTxHex: string = await provider.esplora.getTxHex(
          gatheredUtxos.utxos[i].txId
        )
        psbt.addInput({
          hash: gatheredUtxos.utxos[i].txId,
          index: gatheredUtxos.utxos[i].outputIndex,
          nonWitnessUtxo: Buffer.from(previousTxHex, 'hex'),
        })
      }
      if (getAddressType(gatheredUtxos.utxos[i].address) === 2) {
        const redeemScript = bitcoin.script.compile([
          bitcoin.opcodes.OP_0,
          bitcoin.crypto.hash160(
            Buffer.from(account.nestedSegwit.pubkey, 'hex')
          ),
        ])

        psbt.addInput({
          hash: gatheredUtxos.utxos[i].txId,
          index: gatheredUtxos.utxos[i].outputIndex,
          redeemScript: redeemScript,
          witnessUtxo: {
            value: gatheredUtxos.utxos[i].satoshis,
            script: bitcoin.script.compile([
              bitcoin.opcodes.OP_HASH160,
              bitcoin.crypto.hash160(redeemScript),
              bitcoin.opcodes.OP_EQUAL,
            ]),
          },
        })
      }
      if (
        getAddressType(gatheredUtxos.utxos[i].address) === 1 ||
        getAddressType(gatheredUtxos.utxos[i].address) === 3
      ) {
        psbt.addInput({
          hash: gatheredUtxos.utxos[i].txId,
          index: gatheredUtxos.utxos[i].outputIndex,
          witnessUtxo: {
            value: gatheredUtxos.utxos[i].satoshis,
            script: Buffer.from(gatheredUtxos.utxos[i].scriptPk, 'hex'),
          },
        })
      }
    }

    for (let i = 0; i < alkaneUtxos.alkaneUtxos.length * 2; i++) {
    psbt.addOutput({
      address: account.taproot.address,
      value: 546,
    })
  }
    

    const output = { script: protostone, value: 0 }
    psbt.addOutput(output)

    const changeAmount =
      gatheredUtxos.totalAmount +
      (alkaneUtxos?.totalSatoshis || 0) -
      finalFee -
      546 * alkaneUtxos.alkaneUtxos.length * 2

    psbt.addOutput({
      address: account[account.spendStrategy.changeAddress].address,
      value: changeAmount,
    })


    const formattedPsbtTx = await formatInputsToSign({
      _psbt: psbt,
      senderPublicKey: account.taproot.pubkey,
      network: provider.network,
    })

    return {
      psbt: formattedPsbtTx.toBase64(),
      psbtHex: formattedPsbtTx.toHex(),
    }
  } catch (error) {
    throw new OylTransactionError(error)
  }
}
export const actualSplitFee = async ({
  gatheredUtxos,
  account,
  protostone,
  provider,
  feeRate,
  signer,
  alkaneUtxos,
}: {
  gatheredUtxos: GatheredUtxos
  account: Account
  protostone: Buffer
  provider: Provider
  feeRate: number
  signer: Signer
  alkaneUtxos?: {
    alkaneUtxos: any[]
    totalSatoshis: number
  }
}) => {
  if (!feeRate) {
    feeRate = (await provider.esplora.getFeeEstimates())['1']
  }

  const { psbt } = await createSplitPsbt({
    gatheredUtxos,
    account,
    protostone,
    provider,
    feeRate,
    alkaneUtxos,
  })

  const { signedPsbt } = await signer.signAllInputs({
    rawPsbt: psbt,
    finalize: true,
  })

  let rawPsbt = bitcoin.Psbt.fromBase64(signedPsbt, {
    network: account.network,
  })
    .extractTransaction()
    .toHex()

  const vsize = (
    await provider.sandshrew.bitcoindRpc.testMemPoolAccept([rawPsbt])
  )[0].vsize

  const correctFee = vsize * feeRate

  const { psbt: finalPsbt } = await createSplitPsbt({
    gatheredUtxos,
    account,
    protostone,
    provider,
    feeRate,
    alkaneUtxos,
    fee: correctFee,
  })

  const { signedPsbt: finalSignedPsbt } = await signer.signAllInputs({
    rawPsbt: finalPsbt,
    finalize: true,
  })

  let finalRawPsbt = bitcoin.Psbt.fromBase64(finalSignedPsbt, {
    network: account.network,
  })
    .extractTransaction()
    .toHex()

  const finalVsize = (
    await provider.sandshrew.bitcoindRpc.testMemPoolAccept([finalRawPsbt])
  )[0].vsize

  const finalFee = finalVsize * feeRate

  return { fee: finalFee }
}
