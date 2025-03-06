// Import required modules
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { u128, u32 } = require('@magiceden-oss/runestone-lib/dist/src/integer');
const { ProtoStone, encodeRunestoneProtostone } = require('alkanes/lib/index.js');
const { ProtoruneRuneId } = require('alkanes/lib/protorune/protoruneruneid');

// Initialize the ECC library
bitcoin.initEccLib(ecc);

// Constants
const DUST_LIMIT = 546; // Minimum amount for a UTXO (in satoshis)
const MIN_FEE = 250; // Minimum fee (in satoshis)
const NETWORK = bitcoin.networks.bitcoin;

/**
 * Creates a minimal PSBT template for minting Methane tokens on the Alkanes protocol
 * This template only includes the outputs and lets the wallet handle inputs and change
 * @param {number} feeRate - Fee rate in sat/vB
 * @param {string} mintData - Mint data in format "2,1,77"
 * @param {string} userAddress - User's native SegWit address (bc1p...)
 * @returns {Object} - PSBT in hex format
 */
const createAlkanesMintPSBT = async (feeRate, mintData, userAddress) => {
  console.log(`Creating Alkanes mint PSBT with fee rate ${feeRate} and mint data ${mintData} for address ${userAddress}`);
  
  try {
    // 1. Parse the mint data
    const parts = mintData.split(',').map(Number);
    if (parts.length !== 3) {
      throw new Error(`Invalid mint data format: ${mintData}. Expected format: "2,1,77"`);
    }
    
    // 2. Validate user address
    if (!userAddress || !userAddress.startsWith('bc1p')) {
      throw new Error(`Invalid native SegWit address: ${userAddress}. Native SegWit address (bc1p...) required.`);
    }
    
    // 3. Create a minimal PSBT template
    const psbt = new bitcoin.Psbt({ network: NETWORK });
    
    // Create the Alkanes protocol data using the proper encoding
    const protostone = encodeRunestoneProtostone({
      protostones: [
        ProtoStone.message({
          protocolTag: 1n, // Alkanes protocol tag
          edicts: [
            {
              id: new ProtoruneRuneId(
                u128(BigInt(parts[0])), // Type
                u128(BigInt(parts[1]))  // Action
              ),
              amount: u128(BigInt(parts[2])), // Data
              output: u32(BigInt(0)),
            },
          ],
          pointer: 0,
          refundPointer: 0,
          calldata: Buffer.from([]),
        }),
      ],
    }).encodedRunestone;
    
    // Add the recipient output (dust limit) - this should be a Taproot address (bc1q...)
    // For now, we'll use the provided userAddress, but in a real implementation,
    // the wallet would replace this with the correct Taproot address
    psbt.addOutput({
      address: userAddress, // Should be a Taproot address (bc1q...)
      value: DUST_LIMIT,
    });
    
    // Add the OP_RETURN output with the Alkanes protocol data
    psbt.addOutput({
      script: protostone,
      value: 0,
    });
    
    // We don't add any inputs or change outputs - the wallet will handle those
    
    // Convert to hex format
    const psbtHex = psbt.toHex();
    
    console.log("PSBT template created successfully");
    
    // Return the PSBT in hex format
    return {
      psbt: psbtHex,
      format: "hex",
      feeRate
    };
  } catch (error) {
    console.error("Error creating PSBT template:", error);
    throw error;
  }
};

module.exports = {
  createAlkanesMintPSBT
};
