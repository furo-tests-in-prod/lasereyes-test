import React, { useState, useEffect } from 'react';
import { LaserEyesProvider, MAINNET } from '@omnisat/lasereyes';
import WalletConnector from './WalletConnector';

function App() {
  // This state is used to ensure we only render the provider on the client side
  // to avoid SSR conflicts
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render the LaserEyesProvider on the client side
  if (!isClient) return null;

  return (
    <LaserEyesProvider config={{ network: MAINNET }}>
      <div>
        <h1>LaserEyes SDK Demo</h1>
        <p>
          This is a demo of the LaserEyes SDK for Bitcoin wallet integration.
        </p>
        <WalletConnector />
      </div>
    </LaserEyesProvider>
  );
}

export default App;