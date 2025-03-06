import { Account, Signer, Provider } from '..'
import * as bitcoin from 'bitcoinjs-lib'
import { AlkanesPayload, GatheredUtxos } from '../shared/interface'
import { timeout, tweakSigner } from '../shared/utils'
import { createDeployCommit, createDeployReveal, deployCommit } from './alkanes'

export const contractDeployment = async ({
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

  const reveal = await deployReveal({
    commitTxId: txId,
    script,
    protostone,
    account,
    provider,
    feeRate,
    signer,
  })

  return { ...reveal, commitTx: txId }
}

export const actualDeployCommitFee = async ({
  payload,
  tweakedTaprootKeyPair,
  gatheredUtxos,
  account,
  provider,
  feeRate,
  signer,
}: {
  payload: AlkanesPayload
  tweakedTaprootKeyPair: bitcoin.Signer
  gatheredUtxos: GatheredUtxos
  account: Account
  provider: Provider
  feeRate?: number
  signer: Signer
}) => {
  if (!feeRate) {
    feeRate = (await provider.esplora.getFeeEstimates())['1']
  }

  const { psbt } = await createDeployCommit({
    payload,
    gatheredUtxos,
    tweakedTaprootKeyPair,
    account,
    provider,
    feeRate,
  })
  const { signedPsbt } = await signer.signAllInputs({
    rawPsbt: psbt,
    finalize: true,
  })

  let rawPsbt = bitcoin.Psbt.fromBase64(signedPsbt, {
    network: provider.network,
  })

  const signedHexPsbt = rawPsbt.extractTransaction().toHex()

  const vsize = (
    await provider.sandshrew.bitcoindRpc.testMemPoolAccept([signedHexPsbt])
  )[0].vsize

  const correctFee = vsize * feeRate

  const { psbt: finalPsbt } = await createDeployCommit({
    payload,
    gatheredUtxos,
    tweakedTaprootKeyPair,
    account,
    provider,
    feeRate,
    fee: correctFee,
  })

  const { signedPsbt: signedAll } = await signer.signAllInputs({
    rawPsbt: finalPsbt,
    finalize: true,
  })

  let finalRawPsbt = bitcoin.Psbt.fromBase64(signedAll, {
    network: provider.network,
  })

  const finalSignedHexPsbt = finalRawPsbt.extractTransaction().toHex()

  const finalVsize = (
    await provider.sandshrew.bitcoindRpc.testMemPoolAccept([finalSignedHexPsbt])
  )[0].vsize

  const finalFee = finalVsize * feeRate

  return { fee: finalFee }
}

export const actualDeployRevealFee = async ({
  protostone,
  tweakedTaprootKeyPair,
  commitTxId,
  receiverAddress,
  script,
  provider,
  feeRate,
}: {
  protostone: Buffer
  tweakedTaprootKeyPair: bitcoin.Signer
  commitTxId: string
  receiverAddress: string
  script: Buffer
  provider: Provider
  signer: Signer
  feeRate?: number
}) => {
  if (!feeRate) {
    feeRate = (await provider.esplora.getFeeEstimates())['1']
  }

  const { psbt } = await createDeployReveal({
    protostone,
    commitTxId,
    receiverAddress,
    script,
    tweakedTaprootKeyPair,
    provider,
    feeRate,
  })

  let rawPsbt = bitcoin.Psbt.fromBase64(psbt, {
    network: provider.network,
  })

  rawPsbt.signInput(0, tweakedTaprootKeyPair)
  rawPsbt.finalizeInput(0)

  const signedHexPsbt = rawPsbt.extractTransaction().toHex()

  const vsize = (
    await provider.sandshrew.bitcoindRpc.testMemPoolAccept([signedHexPsbt])
  )[0].vsize

  const correctFee = vsize * feeRate

  const { psbt: finalPsbt } = await createDeployReveal({
    protostone,
    commitTxId,
    receiverAddress,
    script,
    tweakedTaprootKeyPair,
    provider,
    feeRate,
    fee: correctFee,
  })

  let finalRawPsbt = bitcoin.Psbt.fromBase64(finalPsbt, {
    network: provider.network,
  })

  finalRawPsbt.signInput(0, tweakedTaprootKeyPair)
  finalRawPsbt.finalizeInput(0)

  const finalSignedHexPsbt = finalRawPsbt.extractTransaction().toHex()

  const finalVsize = (
    await provider.sandshrew.bitcoindRpc.testMemPoolAccept([finalSignedHexPsbt])
  )[0].vsize

  const finalFee = finalVsize * feeRate

  return { fee: finalFee }
}

export const deployReveal = async ({
  protostone,
  commitTxId,
  script,
  account,
  provider,
  feeRate,
  signer,
}: {
  protostone: Buffer
  commitTxId: string
  script: string
  account: Account
  provider: Provider
  feeRate?: number
  signer: Signer
}) => {
  const tweakedTaprootKeyPair: bitcoin.Signer = tweakSigner(
    signer.taprootKeyPair,
    {
      network: provider.network,
    }
  )

  const { fee } = await actualDeployRevealFee({
    protostone,
    tweakedTaprootKeyPair,
    receiverAddress: account.taproot.address,
    commitTxId,
    script: Buffer.from(script, 'hex'),
    provider,
    feeRate,
    signer,
  })

  const { psbt: finalRevealPsbt } = await createDeployReveal({
    protostone,
    tweakedTaprootKeyPair,
    receiverAddress: account.taproot.address,
    commitTxId,
    script: Buffer.from(script, 'hex'),
    provider,
    feeRate,
    fee,
  })

  let finalReveal = bitcoin.Psbt.fromBase64(finalRevealPsbt, {
    network: provider.network,
  })

  finalReveal.signInput(0, tweakedTaprootKeyPair)
  finalReveal.finalizeInput(0)

  const finalSignedPsbt = finalReveal.toBase64()

  const revealResult = await provider.pushPsbt({
    psbtBase64: finalSignedPsbt,
  })

  return revealResult
}
