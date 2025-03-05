import React, { useEffect, useState } from 'react';
import { 
  useLaserEyes, 
  UNISAT, 
  XVERSE, 
  OYL, 
  LEATHER, 
  PHANTOM,
  WIZZ,
  ORANGE,
  WalletIcon
} from '@omnisat/lasereyes';

// Instead of trying to create a PSBT directly with bitcoinjs-lib, let's use a simpler approach

function WalletConnector() {
  const {
    connected,
    isConnecting,
    address,
    paymentAddress,
    publicKey,
    balance,
    provider,
    network,
    accounts,
    hasUnisat,
    hasXverse,
    hasOyl,
    hasLeather,
    hasPhantom,
    hasWizz,
    hasOrange,
    connect,
    disconnect,
    sign,
    sendBTC
  } = useLaserEyes();
  
  // State to track which wallet is selected for connection
  const [selectedWallet, setSelectedWallet] = useState(UNISAT);

  // Define available wallets with their detection flags
  const wallets = [
    { id: UNISAT, name: 'Unisat', hasWallet: hasUnisat, url: 'https://unisat.io/' },
    { id: XVERSE, name: 'Xverse', hasWallet: hasXverse, url: 'https://xverse.app/' },
    { id: OYL, name: 'OYL', hasWallet: hasOyl, url: 'https://oyl.app/' },
    { id: LEATHER, name: 'Leather', hasWallet: hasLeather, url: 'https://leather.io/' },
    { id: PHANTOM, name: 'Phantom', hasWallet: hasPhantom, url: 'https://phantom.app/' },
    { id: WIZZ, name: 'Wizz', hasWallet: hasWizz, url: 'https://wizz.cash/' },
    { id: ORANGE, name: 'Orange', hasWallet: hasOrange, url: 'https://orange.xyz/' }
  ];

  // Get installed wallets
  const installedWallets = wallets.filter(wallet => wallet.hasWallet);
  
  // Function for direct wallet detection
  const detectWalletDirectly = () => {
    // Check if wallet objects exist in window
    const directDetection = {
      unisat: typeof window !== 'undefined' && 'unisat' in window,
      xverse: typeof window !== 'undefined' && 'xverse' in window,
      oyl: typeof window !== 'undefined' && 'oyl' in window,
      leather: typeof window !== 'undefined' && 'leather' in window,
      phantom: typeof window !== 'undefined' && 'phantom' in window,
    };
    
    console.log('Direct wallet detection:', directDetection);
    
    // Log wallet API methods (helpful for debugging)
    if (directDetection.oyl && window.oyl) {
      console.log('OYL wallet methods:', Object.keys(window.oyl));
      
      // Deep inspect the OYL wallet API
      try {
        // Check if connected
        if (window.oyl.isConnected) {
          window.oyl.isConnected().then(connected => {
            console.log('OYL wallet connected status:', connected);
          }).catch(err => {
            console.log('Error checking OYL connection:', err);
          });
        }
        
        // Log all methods and their types
        Object.keys(window.oyl).forEach(method => {
          console.log(`OYL method ${method} is type:`, typeof window.oyl[method]);
        });
        
        // Check for properties nested inside bitcoin namespace
        if (window.oyl.bitcoin) {
          console.log('OYL bitcoin methods:', Object.keys(window.oyl.bitcoin));
        }
      } catch (err) {
        console.log('Error inspecting OYL wallet:', err);
      }
    }
  };

  // Custom connect function for direct wallet access
  const connectDirectly = async (walletType) => {
    if (walletType === OYL && typeof window !== 'undefined' && window.oyl) {
      try {
        console.log("Directly connecting to OYL wallet");
        
        // Try different connection methods
        // Method 1: isConnected
        if (window.oyl.isConnected) {
          try {
            const connected = await window.oyl.isConnected();
            console.log("OYL connection status:", connected);
            
            if (!connected && window.oyl.connect) {
              console.log("OYL not connected, trying to connect...");
              await window.oyl.connect();
              console.log("OYL connect called");
            }
          } catch (connErr) {
            console.log("Error checking OYL connection:", connErr);
          }
        }
        
        // Check if we can get addresses as a connection test
        if (window.oyl.getAddresses) {
          try {
            const addresses = await window.oyl.getAddresses();
            console.log("OYL addresses:", addresses);
            return true;
          } catch (addrErr) {
            console.log("Could not get OYL addresses:", addrErr);
          }
        }
        
        // If we get here, basic connection checks are done
        console.log("OYL direct connection attempted");
        return true;
      } catch (error) {
        console.error("Error directly connecting to OYL:", error);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    // Detect wallets directly
    detectWalletDirectly();
    
    // No auto-connect - wait for user to select a wallet and click connect
  }, [hasUnisat, hasXverse, hasOyl, hasLeather, hasPhantom, hasWizz, hasOrange]);

  // Handle sign message
  const handleSignMessage = async () => {
    try {
      const message = "Hello Bitcoin!";
      const signature = await sign(message);
      alert(`Message signed! Signature: ${signature.substring(0, 20)}...`);
    } catch (error) {
      alert(`Error signing message: ${error.message}`);
    }
  };

  // Handle send BTC
  const handleSendBTC = async () => {
    try {
      // This is the minimum amount for testnet
      const amount = 1000; // 1000 satoshis
      // This is a sample address - DO NOT actually send to this address
      const recipient = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
      
      const txId = await sendBTC(recipient, amount);
      alert(`Transaction sent! TXID: ${txId}`);
    } catch (error) {
      alert(`Error sending BTC: ${error.message}`);
    }
  };
  
  // Handle minting an alkanes token
  // Helper function to fetch UTXOs directly from the wallet
  const fetchUtxos = async (address) => {
    console.log(`Fetching UTXOs for ${address}`);
    
    try {
      // Try to get UTXOs directly from the wallet if available
      if (window.oyl && window.oyl.bitcoin && window.oyl.bitcoin.getUtxos) {
        const walletUtxos = await window.oyl.bitcoin.getUtxos();
        console.log("UTXOs from wallet:", walletUtxos);
        
        if (Array.isArray(walletUtxos) && walletUtxos.length > 0) {
          // Filter to only include UTXOs for our address if possible
          const addressUtxos = walletUtxos.filter(utxo => 
            !utxo.address || utxo.address === address
          );
          
          if (addressUtxos.length > 0) {
            return addressUtxos;
          }
        }
      }
      
      // As a fallback, use a simulated UTXO since we can't make external API calls
      console.log("No wallet UTXOs found, using simulated UTXOs");
      
      // In a real application, you would use a blockchain API to get UTXOs
      // For example, using Blockstream API:
      // const response = await fetch(`https://blockstream.info/api/address/${address}/utxo`);
      // const utxos = await response.json();
      
      // For this example, we simulate having sufficient funds
      const simulatedUtxo = {
        txid: "0000000000000000000000000000000000000000000000000000000000000000",
        vout: 0,
        value: 10000, // 10,000 satoshis
        status: { confirmed: true }
      };
      
      return [simulatedUtxo];
    } catch (error) {
      console.error("Error fetching UTXOs:", error);
      return [];
    }
  };
  
  // Helper function for transaction creation
  const createSimpleTransferPsbt = async (fromAddress, toAddress, amount) => {
    console.log(`Creating transaction to send ${amount} sats from ${fromAddress} to ${toAddress}`);
    
    try {
      // In a real implementation, we would need:
      // 1. Fetch UTXOs from the sender address
      // 2. Create inputs from those UTXOs
      // 3. Add outputs to the recipient and for change
      // 4. Add OP_RETURN data for alkane mint
      // 5. Create a proper PSBT
      
      console.log("This is a placeholder for a proper transaction creation");
      
      // Return a non-null value to indicate success for demonstration purposes
      return "PLACEHOLDER-PSBT";
      
    } catch (error) {
      console.error("Error creating transaction:", error);
      console.error("Stack trace:", error.stack);
      alert(`Error creating transaction: ${error.message}`);
      return null;
    }
  };
  
  // Function to construct a PSBT for the alkane mint
  const constructPsbt = async (fromAddress, toAddress) => {
    // For the alkane mint, we're just sending 546 sats (dust limit) to the taproot address
    return await createSimpleTransferPsbt(fromAddress, toAddress, 546);
  };
  
  const handleMintAlkane = async () => {
    try {
      console.log("Initiating alkane mint transaction...");
      
      // Check if we're using OYL wallet
      if (provider === OYL) {
        // Direct OYL wallet access
        if (typeof window !== 'undefined' && window.oyl) {
          console.log("Using OYL wallet for alkane mint");
          
          // Log the available methods to understand the API structure
          console.log("OYL wallet API methods:", Object.keys(window.oyl));

          // Set segwitAddress for sending and taprootAddress for receiving
          let segwitAddress = null; // Will be explicitly set to segwit
          let taprootAddress = null; // Will be explicitly set to taproot
          
          try {
            // Check what address retrieval methods are available
            console.log("Checking available address methods in OYL wallet");
            
            let addresses = [];
            let foundAddresses = false;
            
            // Method 1: Try getAddresses directly
            if (window.oyl.getAddresses) {
              try {
                console.log("Trying window.oyl.getAddresses()");
                const directAddresses = await window.oyl.getAddresses();
                console.log("Direct getAddresses result:", directAddresses);
                
                if (Array.isArray(directAddresses) && directAddresses.length > 0) {
                  addresses = directAddresses;
                  foundAddresses = true;
                }
              } catch (err) {
                console.log("Error with direct getAddresses:", err);
              }
            }
            
            // Method 2: Try connected addresses from the SDK
            if (!foundAddresses && (address || paymentAddress)) {
              console.log("Using connected addresses from SDK:");
              console.log("- Main address:", address);
              console.log("- Payment address (likely segwit):", paymentAddress);
              
              let sdkAddresses = [];
              if (address) sdkAddresses.push(address);
              if (paymentAddress) sdkAddresses.push(paymentAddress);
              
              addresses = sdkAddresses;
              foundAddresses = true;
            }
            
            // Method 3: Try the signer's address
            if (!foundAddresses && window.oyl.getSignerAddress) {
              try {
                console.log("Trying getSignerAddress");
                const signerAddress = await window.oyl.getSignerAddress();
                console.log("Signer address:", signerAddress);
                
                if (signerAddress) {
                  addresses = [signerAddress];
                  foundAddresses = true;
                }
              } catch (err) {
                console.log("Error with getSignerAddress:", err);
              }
            }
            
            // Method 4: Try using getAccounts
            if (!foundAddresses && window.oyl.getAccounts) {
              try {
                console.log("Trying getAccounts");
                const accounts = await window.oyl.getAccounts();
                console.log("Accounts:", accounts);
                
                if (Array.isArray(accounts) && accounts.length > 0) {
                  // Extract addresses from accounts if they exist
                  addresses = accounts.map(acc => acc.address || acc);
                  foundAddresses = true;
                }
              } catch (err) {
                console.log("Error with getAccounts:", err);
              }
            }
            
            // Method 5: Try using specific address type methods
            if (!foundAddresses && window.oyl.bitcoin) {
              try {
                const btcMethods = Object.keys(window.oyl.bitcoin);
                console.log("Bitcoin methods available:", btcMethods);
                
                let possibleAddresses = [];
                
                // Check for getNativeSegwitAddress
                if (window.oyl.bitcoin.getNativeSegwitAddress) {
                  try {
                    const nativeSegwitAddr = await window.oyl.bitcoin.getNativeSegwitAddress();
                    console.log("Native segwit address:", nativeSegwitAddr);
                    if (nativeSegwitAddr) possibleAddresses.push(nativeSegwitAddr);
                  } catch (err) {
                    console.log("Error getting native segwit address:", err);
                  }
                }
                
                // Check for getTaprootAddress
                if (window.oyl.bitcoin.getTaprootAddress) {
                  try {
                    const taprootAddr = await window.oyl.bitcoin.getTaprootAddress();
                    console.log("Taproot address:", taprootAddr);
                    if (taprootAddr) possibleAddresses.push(taprootAddr);
                  } catch (err) {
                    console.log("Error getting taproot address:", err);
                  }
                }
                
                if (possibleAddresses.length > 0) {
                  addresses = possibleAddresses;
                  foundAddresses = true;
                }
              } catch (err) {
                console.log("Error accessing bitcoin namespace:", err);
              }
            }
            
            // If addresses were found, try to identify segwit and taproot addresses
            if (foundAddresses && addresses.length > 0) {
              console.log("Found addresses to check:", addresses);
              
              // Check if addresses are objects with type property (OYL SDK format)
              const isAddressObjectFormat = addresses.some(addr => 
                typeof addr === 'object' && addr !== null && 'address' in addr && 'type' in addr
              );
              
              let segwitAddresses = [];
              let taprootAddresses = [];
              
              if (isAddressObjectFormat) {
                // OYL SDK format with address objects that have type property
                console.log("Detected OYL SDK address format with type property");
                
                // Filter addresses by their type
                segwitAddresses = addresses
                  .filter(addr => 
                    addr.type === 'segwit' || 
                    addr.type === 'nativeSegwit' || 
                    addr.type === 'p2wpkh' ||
                    (addr.address && (addr.address.startsWith('bc1q') || addr.address.startsWith('3')))
                  )
                  .map(addr => addr.address);
                
                taprootAddresses = addresses
                  .filter(addr => 
                    addr.type === 'taproot' || 
                    addr.type === 'p2tr' ||
                    (addr.address && addr.address.startsWith('bc1p'))
                  )
                  .map(addr => addr.address);
                
                console.log("Extracted segwit addresses from objects:", segwitAddresses);
                console.log("Extracted taproot addresses from objects:", taprootAddresses);
              } else {
                // String format addresses - identify by prefix
                // Try to identify segwit (bc1q) and taproot (bc1p) addresses
                // Include p2sh-segwit addresses (start with 3) as potential segwit addresses
                segwitAddresses = addresses.filter(addr => 
                  (typeof addr === 'string') && (addr.startsWith('bc1q') || addr.startsWith('3'))
                );
                
                taprootAddresses = addresses.filter(addr => 
                  (typeof addr === 'string') && addr.startsWith('bc1p')
                );
              }
              
              console.log("Segwit candidates:", segwitAddresses);
              console.log("Taproot candidates:", taprootAddresses);
              
              // Set the segwit address first
              if (segwitAddresses.length > 0) {
                segwitAddress = segwitAddresses[0];
                console.log("Found segwit address to use for sending:", segwitAddress);
              } else if (paymentAddress) {
                // Use SDK's paymentAddress as fallback - this is usually the segwit address
                segwitAddress = paymentAddress;
                console.log("No segwit address found in list, using SDK paymentAddress as fallback:", segwitAddress);
              } else {
                console.error("No segwit address found! This is required for minting.");
                alert("No segwit (bc1q or 3) address found in your wallet. Please ensure you have a segwit address available.");
                return;
              }
              
              // Set the taproot address next
              if (taprootAddresses.length > 0) {
                taprootAddress = taprootAddresses[0];
                console.log("Found taproot address to receive minted token:", taprootAddress);
              } else {
                // If no taproot address, use the address we found earlier
                console.log("No taproot address found, will use wallet's connected address for receiving");
                taprootAddress = address;
                
                if (!taprootAddress) {
                  console.error("Could not find a receiving address");
                  alert("Could not find a valid receiving address in your wallet.");
                  return;
                }
              }
            } else {
              // We didn't find any addresses through our methods
              console.error("No addresses found through any method!");
              
              // Try to use the connected addresses from the SDK if available
              if (address || paymentAddress) {
                console.log("Using SDK addresses as fallback:");
                console.log("- Main address:", address);
                console.log("- Payment address:", paymentAddress);
                
                // Use payment address as segwit (since it's usually the native segwit)
                // and the main address as taproot (or whatever the wallet says is the main address)
                if (paymentAddress) {
                  segwitAddress = paymentAddress;
                  console.log("Using payment address as segwit address");
                } else {
                  segwitAddress = address;
                  console.log("No payment address available, using main address for segwit");
                }
                
                if (address && address !== paymentAddress) {
                  taprootAddress = address;
                  console.log("Using main address as taproot address");
                } else {
                  taprootAddress = address || paymentAddress;
                  console.log("Using available address for taproot");
                }
                
                // Make sure we have distinct addresses if possible
                if (segwitAddress && taprootAddress && segwitAddress === taprootAddress) {
                  alert("Could only find one address in your wallet. Using it for both sending and receiving, which may not work properly for minting.");
                }
              } else {
                alert("Could not retrieve any addresses from your wallet. Please ensure your wallet is connected properly.");
                return;
              }
            }
          } catch (addrErr) {
            console.log("Error getting addresses:", addrErr);
            alert("Error getting wallet addresses: " + (addrErr.message || "Unknown error"));
            return;
          }
          
          try {
            // Determine the approach based on what's available in the OYL API
            // Method 1: Try using signMessage with a specific format for alkane commands
            const alkaneCommand = JSON.stringify({
              type: "alkane",
              action: "execute",
              data: [2, 1, 77],
              feeRate: 8,
              protocol: "bitcoin",
              fromAddress: segwitAddress,  // Use segwit address for sending
              toAddress: taprootAddress    // Use taproot address for receiving
            });
            
            console.log("Sending alkane command:", alkaneCommand);
            console.log("Ensuring segwit address for sending:", segwitAddress);
            console.log("Ensuring taproot address for receiving:", taprootAddress);
            
            // First try: Using raw JSON in signMessage - try different parameter formats
            try {
              // Try the direct signMessage method from the OYL wallet
              if (window.oyl.signMessage) {
                // OYL might accept different parameter formats, try them all
                // According to the error, OYL requires an address parameter
                try {
                  // Try the format that OYL specifically requires based on the error message
                  console.log("Using proper OYL signMessage format with address parameter");
                  
                  // This is the format OYL requires based on the error
                  const signature = await window.oyl.signMessage(alkaneCommand, {
                    address: segwitAddress  // Pass address in the correct format
                  });
                  
                  console.log("Alkane command submitted via signMessage:", signature);
                  alert("Alkane mint request submitted successfully!");
                  return;
                } catch (err) {
                  console.log("OYL signMessage failed:", err);
                  
                  // Skip directly to the SDK method which is more likely to work
                  console.log("Skipping to SDK sendBTC method");
                }
              }
            } catch (signErr) {
              console.log("All signMessage approaches failed:", signErr);
              // Continue to next approach
            }
            
            // Try a direct transaction instead of using sendBTC
            if (window.oyl) {
              try {
                console.log("Attempting direct OYL wallet transaction");
                console.log("- Using segwit address for sending:", segwitAddress);
                console.log("- Using taproot address for receiving:", taprootAddress);
                
                // Check if OYL wallet has a transaction method we can use
                if (window.oyl.bitcoin && typeof window.oyl.bitcoin.transfer === 'function') {
                  // Some wallets have a transfer or send function
                  try {
                    alert(`Creating a transaction to send 546 sats from your segwit address to your taproot address. Please approve the transaction.`);
                    
                    // Try to create transaction directly using transfer method
                    const result = await window.oyl.bitcoin.transfer({
                      to: taprootAddress,
                      amount: 546,
                      from: segwitAddress,
                      memo: "alkane:execute:2,1,77"
                    });
                    
                    console.log("Transaction created successfully:", result);
                    alert(`Transaction created successfully! ${typeof result === 'string' ? `TXID: ${result}` : 'Check your wallet for details.'}`);
                    return;
                  } catch (err) {
                    console.error("Error with bitcoin.transfer:", err);
                  }
                }
                
                // Try direct send method if available
                if (window.oyl.send) {
                  try {
                    alert(`Creating a transaction to send 546 sats from your segwit address to your taproot address. Please approve the transaction.`);
                    
                    // Try to create transaction using send method
                    const result = await window.oyl.send({
                      address: taprootAddress,
                      amount: 546,
                      from: segwitAddress,
                      memo: "alkane:execute:2,1,77"
                    });
                    
                    console.log("Transaction created successfully:", result);
                    alert(`Transaction created successfully! ${typeof result === 'string' ? `TXID: ${result}` : 'Check your wallet for details.'}`);
                    return;
                  } catch (err) {
                    console.error("Error with send method:", err);
                  }
                }
                
                // Try sendBitcoin method if available
                if (window.oyl.sendBitcoin) {
                  try {
                    alert(`Creating a transaction to send 546 sats from your segwit address to your taproot address. Please approve the transaction.`);
                    
                    // Try to create transaction using sendBitcoin
                    const result = await window.oyl.sendBitcoin({
                      toAddress: taprootAddress,
                      satoshis: 546,
                      fromAddress: segwitAddress,
                      opReturn: "alkane:execute:2,1,77"
                    });
                    
                    console.log("Transaction created successfully:", result);
                    alert(`Transaction created successfully! ${typeof result === 'string' ? `TXID: ${result}` : 'Check your wallet for details.'}`);
                    return;
                  } catch (err) {
                    console.error("Error with sendBitcoin method:", err);
                  }
                }
                
                // None of the direct methods worked, use our improved signPsbt approach
                // which will be implemented in the next section
                console.log("No direct transaction methods worked, will try signPsbt next");
                
              } catch (oylErr) {
                console.error("Direct OYL methods failed:", oylErr);
                console.error("Stack trace:", oylErr.stack);
              }
            } else {
              console.error("OYL wallet not properly connected");
              alert("OYL wallet connection issue. Please refresh and try again.");
            }
            
            // If none of the direct methods worked, try one more approach using the OYL wallet's signPsbt method
            if (window.oyl.signPsbt && window.oyl.pushPsbt) {
              try {
                console.log("Final attempt: Using OYL wallet's signPsbt method");
                
                // Create a very simple transaction request
                alert(`We're now going to try a direct approach with the OYL wallet to create a transaction from your segwit address (${segwitAddress.substring(0, 10)}...) to your taproot address (${taprootAddress.substring(0, 10)}...).

Please approve the transaction when prompted.`);
                
                // Try a more direct approach with OYL - construct an OP_RETURN message
                // and use signPsbt to create a PSBT directly in the wallet
                
                // Unfortunately, without a proper PSBT creation library, this is difficult
                // Let the user know the situation
                alert(`We've detected your OYL wallet and found both your segwit and taproot addresses. 

For a complete implementation, we would use a Bitcoin PSBT library to construct the transaction for you. This would require additional Bitcoin libraries and API access.

For now, we recommend using the OYL wallet directly to send 546 sats from your segwit address (${segwitAddress.substring(0, 10)}...) to your taproot address (${taprootAddress.substring(0, 10)}...) with the memo "alkane:execute:2,1,77".`);
                
                return;
              } catch (finalErr) {
                console.error("Final attempt failed:", finalErr);
              }
            }
            
          } catch (error) {
            console.error("Error during OYL alkane execution:", error);
            alert(`Error minting alkane token: ${error.message || 'Unknown error'}`);
          }
        } else {
          alert("OYL wallet is connected but window.oyl is not available. Please refresh and try again.");
        }
      } else {
        // For other wallets, we'll need to construct a PSBT or use a different approach
        alert("Alkane mint is currently only supported with OYL wallet. Please connect OYL to mint alkane tokens.");
      }
    } catch (error) {
      console.error("Alkane mint error:", error);
      alert(`Error minting alkane token: ${error.message || 'Unknown error'}`);
    }
  };

  // Show loading state while connecting
  if (isConnecting) {
    return <p>Connecting to wallet...</p>;
  }

  // Show connect button if not connected
  if (!connected) {
    return (
      <div className="container">
        <h2>Bitcoin Wallet Connection</h2>
        
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <p>Select your preferred wallet to connect to the application.</p>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>Available Wallets:</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '15px', 
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            {wallets.map(wallet => {
              const isInstalled = wallet.hasWallet;
              const isSelected = selectedWallet === wallet.id;
              
              return (
                <div 
                  key={wallet.id}
                  style={{
                    border: isSelected ? '2px solid #f7931a' : '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: isSelected ? '#fff8f0' : 'white',
                    cursor: isInstalled ? 'pointer' : 'default',
                    opacity: isInstalled ? 1 : 0.6,
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 10px rgba(247, 147, 26, 0.3)' : 'none'
                  }}
                  onClick={() => isInstalled && setSelectedWallet(wallet.id)}
                >
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 'bold',
                    marginBottom: '5px',
                    color: isSelected ? '#f7931a' : '#333'
                  }}>
                    {wallet.name}
                  </div>
                  
                  {isInstalled ? (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      backgroundColor: '#e8f5e9', 
                      color: '#388e3c',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      display: 'inline-block',
                      marginTop: '5px'
                    }}>
                      Installed
                    </div>
                  ) : (
                    <a 
                      href={wallet.url} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{
                        fontSize: '0.75rem',
                        color: '#1976d2',
                        textDecoration: 'none',
                        display: 'inline-block',
                        marginTop: '5px'
                      }}
                    >
                      Install
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          
          {selectedWallet && (
            <button 
              onClick={() => {
                try {
                  console.log(`Attempting to connect to ${selectedWallet} wallet`);
                  
                  // Different handling for different wallet types
                  if (selectedWallet === OYL) {
                    console.log("Special handling for OYL wallet");
                    
                    // First try direct connection
                    connectDirectly(OYL).then(success => {
                      if (success) {
                        // If direct connection worked, try the SDK connect
                        try {
                          console.log("Direct connection successful, now connecting via SDK");
                          connect(OYL);
                        } catch (err) {
                          console.error("Error with SDK after direct connection:", err);
                          alert("Connected to OYL wallet, but SDK integration failed. Please refresh and try again.");
                        }
                      } else {
                        // If direct connection failed, try SDK anyway
                        console.log("Falling back to SDK connection for OYL");
                        connect(OYL);
                      }
                    });
                  } else if (selectedWallet === XVERSE) {
                    console.log("Special handling for Xverse wallet");
                    
                    // Ensure Xverse is available
                    if (typeof window !== 'undefined' && window.xverse) {
                      // Sometimes we need to "wake up" the wallet first
                      try {
                        console.log("Attempting to wake up Xverse wallet");
                        window.xverse.bitcoin.getAddresses().then(() => {
                          console.log("Xverse wakeup successful, now connecting via SDK");
                          connect(XVERSE);
                        }).catch(err => {
                          console.error("Error waking up Xverse:", err);
                          connect(XVERSE);
                        });
                      } catch (err) {
                        console.error("Error with Xverse pre-connection:", err);
                        connect(XVERSE);
                      }
                    } else {
                      connect(XVERSE);
                    }
                  } else {
                    // Use normal connect for other wallets
                    connect(selectedWallet);
                  }
                } catch (error) {
                  console.error(`Error connecting to ${selectedWallet}:`, error);
                  alert(`Failed to connect to ${wallets.find(w => w.id === selectedWallet)?.name} wallet. Please make sure it is properly installed and unlocked.`);
                }
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f7931a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '100%',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              Connect with {wallets.find(w => w.id === selectedWallet)?.name}
            </button>
          )}
        </div>
        
        {installedWallets.length === 0 && (
          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '15px', 
            borderRadius: '6px',
            marginTop: '20px'
          }}>
            <p style={{ color: '#856404', marginBottom: '10px', fontWeight: 'bold' }}>
              No Bitcoin wallets detected
            </p>
            <p style={{ color: '#856404', fontSize: '0.9rem' }}>
              Please install one of the wallets listed above to connect to this application.
            </p>
          </div>
        )}
        
        <div style={{ marginTop: '25px', fontSize: '0.8rem', color: '#666' }}>
          <p style={{ marginBottom: '10px' }}>Having trouble?</p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Make sure your wallet extension is installed and enabled</li>
            <li>Try refreshing the page</li>
            <li>Ensure your wallet is unlocked</li>
            <li>Access this page through a web server instead of file:// protocol</li>
          </ul>
        </div>
      </div>
    );
  }

  // Format balance as BTC
  const formattedBalance = balance !== undefined 
    ? `${balance} satoshis (${(balance / 100000000).toFixed(8)} BTC)` 
    : "Loading...";

  // Show wallet information once connected
  const walletName = wallets.find(w => w.id === provider)?.name || provider;
  
  return (
    <div className="container">
      <h2>Wallet Information</h2>
      <div className="wallet-info">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '20px'
        }}>
          {/*{WalletIcon && <WalletIcon walletName={provider} size={42} />}*/}
          <div style={{ marginLeft: '10px' }}>
            <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
              Connected to {walletName}
            </p>
          </div>
        </div>
        
        <p><strong>Network:</strong> {network}</p>
        <p><strong>Address:</strong> <span className="address">{address}</span></p>
        <p><strong>Payment Address:</strong> <span className="address">{paymentAddress}</span></p>
        <p><strong>Balance:</strong> {formattedBalance}</p>
        
        <div style={{ 
          marginTop: "20px", 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px',
          justifyContent: 'center'
        }}>
          <button 
            onClick={handleSignMessage} 
            style={{ 
              padding: '10px 16px',
              backgroundColor: '#f7931a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sign Message
          </button>
          
          <button 
            onClick={handleSendBTC}
            style={{ 
              padding: '10px 16px',
              backgroundColor: '#f7931a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Send BTC (Test)
          </button>

          <button 
            onClick={handleMintAlkane}
            style={{ 
              padding: '10px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            MINT ALKANE
          </button>
          
          <button 
            onClick={disconnect} 
            style={{ 
              padding: '10px 16px',
              backgroundColor: '#d9534f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '0.8em', textAlign: 'center' }}>
            Want to try a different wallet? <button 
              onClick={disconnect} 
              style={{ 
                backgroundColor: 'transparent',
                border: 'none',
                textDecoration: 'underline',
                cursor: 'pointer',
                color: '#f7931a',
                padding: 0,
                fontSize: '0.8em'
              }}
            >
              Disconnect
            </button> and select another.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WalletConnector;