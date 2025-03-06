'use client';

import { useState } from 'react';
import { mintMethane } from '../lib/api';
import { ProviderType } from '@omnisat/lasereyes';

interface MintButtonProps {
  connected: boolean;
  address: string | null;
  feeRate: number;
  isConnecting: boolean;
  hasOyl: boolean;
  connect: (walletName: ProviderType) => Promise<void>;
  disconnect: () => void;
}

export default function MintButton({ 
  connected, 
  address, 
  feeRate,
  isConnecting,
  hasOyl,
  connect,
  disconnect
}: MintButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = async () => {
    // Check if OYL wallet is available
    if (!hasOyl) {
      alert("OYL wallet not detected. Please install OYL wallet from https://oyl.io");
      return;
    }
    
    if (!connected || !address) {
      // Try to connect wallet
      try {
        await connect('oyl');
      } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Error connecting wallet: " + (error instanceof Error ? error.message : "Unknown error"));
      }
      return;
    }
    
    // Wallet is connected, proceed with minting
    setIsLoading(true);
    
    try {
      // Call the mintMethane function from our API client
      const result = await mintMethane(feeRate, address);
      alert(`Methane minted successfully! Transaction ID: ${result.txId}`);
    } catch (error) {
      console.error("Error minting Methane:", error);
      alert("Error minting Methane: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine button text
  let buttonText = "CONNECT WALLET TO MINT";
  if (isLoading) {
    buttonText = "MINTING...";
  } else if (isConnecting) {
    buttonText = "CONNECTING...";
  } else if (connected) {
    buttonText = "MINT METHANE";
  }
  
  return (
    <button 
      className="mint-button" 
      onClick={handleClick}
      disabled={isLoading || isConnecting}
    >
      {buttonText}
    </button>
  );
}
