// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function mintMethane(feeRate: number, userAddress: string) {
  try {
    // Step 1: Call backend to create PSBT
    const response = await fetch(`${API_URL}/api/create-mint-psbt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        feeRate,
        mintData: '2,1,77',
        userAddress
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.psbt) {
      throw new Error("Server did not return a valid PSBT");
    }

    // Step 2: Sign the PSBT with the wallet
    console.log("Checking wallet capabilities...");
    console.log("window.oyl exists:", !!window.oyl);
    if (window.oyl) {
      console.log("window.oyl properties:", Object.keys(window.oyl));
      console.log("window.oyl.signPsbt is a function:", typeof window.oyl.signPsbt === 'function');
      console.log("window.oyl.pushPsbt is a function:", typeof window.oyl.pushPsbt === 'function');
    }
    
    if (!window.oyl || typeof window.oyl.signPsbt !== 'function') {
      throw new Error("OYL wallet does not support PSBT signing. Please update your wallet.");
    }

    // Add detailed logging of the response data
    console.log("Server response data:", data);
    console.log("PSBT format:", data.format);
    console.log("PSBT value:", data.psbt.substring(0, 30) + "...");

    // Use the PSBT in its original format (hex)
    let psbtToSign = data.psbt;
    console.log("Using PSBT in original format (hex)");
    console.log("Full PSBT hex:", psbtToSign);
    
    // Try to validate the PSBT hex
    try {
      // Check if it's a valid hex string
      if (!/^[0-9a-fA-F]+$/.test(psbtToSign)) {
        console.warn("PSBT does not appear to be a valid hex string");
      }
      
      // Check if it starts with the PSBT magic bytes (70736274ff)
      if (!psbtToSign.startsWith('70736274ff')) {
        console.warn("PSBT does not start with the expected magic bytes");
      }
    } catch (e) {
      console.error("Error validating PSBT:", e);
    }

    console.log("Requesting wallet to sign PSBT...");
    let signedPsbt;
    try {
      // Try passing the PSBT as an object with a 'psbt' property
      console.log("Trying to sign PSBT with object parameter...");
      signedPsbt = await window.oyl.signPsbt({ psbt: psbtToSign });
      console.log("PSBT signed successfully");
    } catch (signError) {
      console.error("Error signing PSBT with object parameter:", signError);
      
      // If that fails, try passing just the PSBT string
      try {
        console.log("Trying to sign PSBT with string parameter...");
        signedPsbt = await window.oyl.signPsbt(psbtToSign);
        console.log("PSBT signed successfully");
      } catch (secondSignError) {
        console.error("Error signing PSBT with string parameter:", secondSignError);
        throw new Error("Failed to sign transaction: " + (secondSignError instanceof Error ? secondSignError.message : "User rejected or wallet error"));
      }
    }
    
    // Step 3: Broadcast the signed PSBT
    if (!window.oyl || typeof window.oyl.pushPsbt !== 'function') {
      throw new Error("OYL wallet does not support transaction broadcasting. Please update your wallet.");
    }
    
    console.log("Broadcasting signed transaction...");
    let txId;
    try {
      // Use the direct pushPsbt function on the oyl object
      txId = await window.oyl.pushPsbt(signedPsbt);
      console.log("Transaction broadcast successfully:", txId);
    } catch (broadcastError) {
      console.error("Error broadcasting transaction:", broadcastError);
      throw new Error("Failed to broadcast transaction: " + (broadcastError instanceof Error ? broadcastError.message : "Network error"));
    }
    
    return {
      txId,
      success: true
    };
  } catch (error) {
    console.error("Error in mintMethane:", error);
    throw error;
  }
}
