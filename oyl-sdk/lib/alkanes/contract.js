"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployReveal = exports.actualDeployRevealFee = exports.actualDeployCommitFee = exports.contractDeployment = void 0;
const tslib_1 = require("tslib");
const bitcoin = tslib_1.__importStar(require("bitcoinjs-lib"));
const utils_1 = require("../shared/utils");
const alkanes_1 = require("./alkanes");
const contractDeployment = async ({ payload, gatheredUtxos, account, protostone, provider, feeRate, signer, }) => {
    const { script, txId } = await (0, alkanes_1.deployCommit)({
        payload,
        gatheredUtxos,
        account,
        provider,
        feeRate,
        signer,
    });
    await (0, utils_1.timeout)(3000);
    const reveal = await (0, exports.deployReveal)({
        commitTxId: txId,
        script,
        protostone,
        account,
        provider,
        feeRate,
        signer,
    });
    return { ...reveal, commitTx: txId };
};
exports.contractDeployment = contractDeployment;
const actualDeployCommitFee = async ({ payload, tweakedTaprootKeyPair, gatheredUtxos, account, provider, feeRate, signer, }) => {
    if (!feeRate) {
        feeRate = (await provider.esplora.getFeeEstimates())['1'];
    }
    const { psbt } = await (0, alkanes_1.createDeployCommit)({
        payload,
        gatheredUtxos,
        tweakedTaprootKeyPair,
        account,
        provider,
        feeRate,
    });
    const { signedPsbt } = await signer.signAllInputs({
        rawPsbt: psbt,
        finalize: true,
    });
    let rawPsbt = bitcoin.Psbt.fromBase64(signedPsbt, {
        network: provider.network,
    });
    const signedHexPsbt = rawPsbt.extractTransaction().toHex();
    const vsize = (await provider.sandshrew.bitcoindRpc.testMemPoolAccept([signedHexPsbt]))[0].vsize;
    const correctFee = vsize * feeRate;
    const { psbt: finalPsbt } = await (0, alkanes_1.createDeployCommit)({
        payload,
        gatheredUtxos,
        tweakedTaprootKeyPair,
        account,
        provider,
        feeRate,
        fee: correctFee,
    });
    const { signedPsbt: signedAll } = await signer.signAllInputs({
        rawPsbt: finalPsbt,
        finalize: true,
    });
    let finalRawPsbt = bitcoin.Psbt.fromBase64(signedAll, {
        network: provider.network,
    });
    const finalSignedHexPsbt = finalRawPsbt.extractTransaction().toHex();
    const finalVsize = (await provider.sandshrew.bitcoindRpc.testMemPoolAccept([finalSignedHexPsbt]))[0].vsize;
    const finalFee = finalVsize * feeRate;
    return { fee: finalFee };
};
exports.actualDeployCommitFee = actualDeployCommitFee;
const actualDeployRevealFee = async ({ protostone, tweakedTaprootKeyPair, commitTxId, receiverAddress, script, provider, feeRate, }) => {
    if (!feeRate) {
        feeRate = (await provider.esplora.getFeeEstimates())['1'];
    }
    const { psbt } = await (0, alkanes_1.createDeployReveal)({
        protostone,
        commitTxId,
        receiverAddress,
        script,
        tweakedTaprootKeyPair,
        provider,
        feeRate,
    });
    let rawPsbt = bitcoin.Psbt.fromBase64(psbt, {
        network: provider.network,
    });
    rawPsbt.signInput(0, tweakedTaprootKeyPair);
    rawPsbt.finalizeInput(0);
    const signedHexPsbt = rawPsbt.extractTransaction().toHex();
    const vsize = (await provider.sandshrew.bitcoindRpc.testMemPoolAccept([signedHexPsbt]))[0].vsize;
    const correctFee = vsize * feeRate;
    const { psbt: finalPsbt } = await (0, alkanes_1.createDeployReveal)({
        protostone,
        commitTxId,
        receiverAddress,
        script,
        tweakedTaprootKeyPair,
        provider,
        feeRate,
        fee: correctFee,
    });
    let finalRawPsbt = bitcoin.Psbt.fromBase64(finalPsbt, {
        network: provider.network,
    });
    finalRawPsbt.signInput(0, tweakedTaprootKeyPair);
    finalRawPsbt.finalizeInput(0);
    const finalSignedHexPsbt = finalRawPsbt.extractTransaction().toHex();
    const finalVsize = (await provider.sandshrew.bitcoindRpc.testMemPoolAccept([finalSignedHexPsbt]))[0].vsize;
    const finalFee = finalVsize * feeRate;
    return { fee: finalFee };
};
exports.actualDeployRevealFee = actualDeployRevealFee;
const deployReveal = async ({ protostone, commitTxId, script, account, provider, feeRate, signer, }) => {
    const tweakedTaprootKeyPair = (0, utils_1.tweakSigner)(signer.taprootKeyPair, {
        network: provider.network,
    });
    const { fee } = await (0, exports.actualDeployRevealFee)({
        protostone,
        tweakedTaprootKeyPair,
        receiverAddress: account.taproot.address,
        commitTxId,
        script: Buffer.from(script, 'hex'),
        provider,
        feeRate,
        signer,
    });
    const { psbt: finalRevealPsbt } = await (0, alkanes_1.createDeployReveal)({
        protostone,
        tweakedTaprootKeyPair,
        receiverAddress: account.taproot.address,
        commitTxId,
        script: Buffer.from(script, 'hex'),
        provider,
        feeRate,
        fee,
    });
    let finalReveal = bitcoin.Psbt.fromBase64(finalRevealPsbt, {
        network: provider.network,
    });
    finalReveal.signInput(0, tweakedTaprootKeyPair);
    finalReveal.finalizeInput(0);
    const finalSignedPsbt = finalReveal.toBase64();
    const revealResult = await provider.pushPsbt({
        psbtBase64: finalSignedPsbt,
    });
    return revealResult;
};
exports.deployReveal = deployReveal;
//# sourceMappingURL=contract.js.map