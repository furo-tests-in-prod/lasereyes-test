// src/types/oyl.d.ts
interface OylWallet {
  isConnected: () => Promise<boolean>;
  connect: () => Promise<void>;
  disconnect: () => void;
  getAddresses: () => Promise<string[]>;
  getBalance: () => Promise<any>;
  signPsbt: (psbt: string | { psbt: string }) => Promise<string>;
  signPsbts?: (psbts: string[]) => Promise<string[]>;
  pushPsbt: (signedPsbt: string) => Promise<string>;
  signMessage?: (message: string, address: string) => Promise<string>;
  // Legacy properties - may not be present in newer versions
  bitcoin?: {
    signPsbt: (psbt: string) => Promise<string>;
    pushPsbt: (signedPsbt: string) => Promise<string>;
    sendOpReturn?: (options: { opReturn: string, feeRate: number, amount: number }) => Promise<any>;
  };
  alkane?: {
    execute: (options: { data: string, feeRate: number, protocol: string }) => Promise<any>;
  };
}

declare global {
  interface Window {
    oyl?: OylWallet;
  }
}

export {};
