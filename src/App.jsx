import React, { useState, useEffect } from 'react';
import { LaserEyesProvider, MAINNET, TESTNET } from '@omnisat/lasereyes';
import WalletConnector from './WalletConnector.jsx';
import './styles.css';

function App() {
  // This state is used to ensure we only render the provider on the client side
  // to avoid SSR conflicts
  const [isClient, setIsClient] = useState(false);
  // Use testnet for testing
  const [network, setNetwork] = useState(TESTNET);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render the LaserEyesProvider on the client side
  if (!isClient) return <p>Loading...</p>;

  return (
    <LaserEyesProvider config={{ network }}>
      <div className="container">
        <h1>LaserEyes SDK Bitcoin Wallet Demo</h1>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p>
            Current Network: <strong>{network === MAINNET ? "Mainnet" : "Testnet"}</strong>
          </p>
          <div>
            <button 
              onClick={() => setNetwork(MAINNET)}
              style={{ 
                marginRight: '10px', 
                backgroundColor: network === MAINNET ? '#f7931a' : '#888'
              }}
            >
              Mainnet
            </button>
            <button 
              onClick={() => setNetwork(TESTNET)}
              style={{ 
                backgroundColor: network === TESTNET ? '#f7931a' : '#888'
              }}
            >
              Testnet
            </button>
          </div>
          <p style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
            Note: Changing network will disconnect the wallet
          </p>
        </div>
        
        <WalletConnector />
        
        <div style={{ fontSize: '0.8em', color: '#666', marginTop: '40px', textAlign: 'center' }}>
          <p>
            A demo of the <a href="https://www.lasereyes.build/docs/getting-started" target="_blank" rel="noreferrer">LaserEyes SDK</a> for Bitcoin wallet integration
          </p>
        </div>
      </div>
    </LaserEyesProvider>
  );
}

export default App;