# LaserEyes SDK Test Environment

This repository contains a test environment for the LaserEyes SDK, which enables Bitcoin wallet integration in web applications.

## Overview

LaserEyes SDK is a JavaScript library that provides a unified API for interacting with Bitcoin wallets like Unisat and Xverse in browser environments. This test environment demonstrates how to set up and use the SDK in a React application.

## Installation

```bash
# Clone this repository
git clone https://github.com/yourusername/laser-eyes-test.git
cd laser-eyes-test

# Install dependencies
npm install
```

## Usage

### Server-side testing

To run the basic server-side test:

```bash
npm test
```

Note: This only demonstrates the configuration part of the SDK. Full wallet functionality requires a browser environment with wallet extensions installed.

### Browser environment setup

To use the LaserEyes SDK in a browser environment:

1. Install the Unisat wallet browser extension from [https://unisat.io/](https://unisat.io/)
2. Set up a React application with a bundler like webpack or vite
3. Use the components provided in this repository:
   - `App.jsx` - Main application with LaserEyesProvider
   - `WalletConnector.jsx` - Component that demonstrates how to use the useLaserEyes hook

## Components

### LaserEyesProvider

The main context provider that should wrap your app. It initializes the LaserEyes context and makes the wallet connection and functionality available to all child components.

```jsx
import { LaserEyesProvider, MAINNET } from '@omnisat/lasereyes';

function App() {
  return (
    <LaserEyesProvider config={{ network: MAINNET }}>
      {/* Your app components */}
    </LaserEyesProvider>
  );
}
```

### useLaserEyes Hook

A hook that provides access to all wallet functions and state:

```jsx
import { useLaserEyes, UNISAT } from '@omnisat/lasereyes';

function WalletConnector() {
  const {
    connected,
    address,
    balance,
    connect,
    disconnect,
    // ...more properties and methods
  } = useLaserEyes();

  // Connect to wallet
  const handleConnect = () => {
    connect(UNISAT);
  };

  return (
    <div>
      {!connected ? (
        <button onClick={handleConnect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Address: {address}</p>
          <p>Balance: {balance} satoshis</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
```

## Supported Wallets

- [Unisat](https://unisat.io/)
- [Xverse](https://xverse.io/)

## Demo

To see a live demo of the LaserEyes SDK, visit [https://demo.lasereyes.build/](https://demo.lasereyes.build/)

## License

This test environment is provided under the ISC license.