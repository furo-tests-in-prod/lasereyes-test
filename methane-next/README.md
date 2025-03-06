# Methane - The First Memecoin on Alkanes

Methane is a memecoin built on the Alkanes metaprotocol on Bitcoin. This project provides a web application for minting Methane tokens using the OYL wallet.

## Features

- Connect to OYL wallet via LaserEyes SDK
- Set custom fee rates for transactions
- Mint Methane tokens on the Alkanes metaprotocol
- Real-time wallet connection status
- Gas bubble animation theme

## Prerequisites

- Node.js (v16 or higher)
- OYL wallet browser extension installed
- Bitcoin for transaction fees

## Project Structure

- `src/` - Frontend Next.js application
  - `app/` - Next.js app router components
  - `components/` - React components
  - `lib/` - Utility functions and API client
  - `types/` - TypeScript type definitions
- `server/` - Backend Express server
  - `server.js` - Express server setup
  - `oyl-sdk-integration.js` - OYL SDK integration for PSBT creation

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install
```

### Running the Application

To run both the frontend and backend concurrently:

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

To run them separately:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:server
```

## Usage

1. Visit http://localhost:3000 in your browser
2. Make sure you have the OYL wallet extension installed
3. Click "CONNECT WALLET TO MINT" to connect your wallet
4. Adjust the fee rate if desired
5. Click "MINT METHANE" to create and sign a transaction
6. Approve the transaction in your wallet
7. Wait for the transaction to be confirmed on the Bitcoin network

## API Endpoints

- `POST /api/create-mint-psbt` - Create a PSBT for minting Methane tokens
  - Request body:
    ```json
    {
      "feeRate": 5,
      "mintData": "2,1,77",
      "userAddress": "bc1p..."
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "psbt": "...",
      "format": "hex",
      "message": "PSBT created successfully"
    }
    ```

## Technologies Used

- **Frontend**:
  - Next.js
  - React
  - TypeScript
  - Tailwind CSS
  - LaserEyes SDK

- **Backend**:
  - Express.js
  - bitcoinjs-lib
  - OYL SDK (local integration)

## License

This project is licensed under the MIT License.
