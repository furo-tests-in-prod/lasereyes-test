# Methane - The First Memecoin on Alkanes

This project implements a frontend and backend for minting Methane tokens on the Alkanes metaprotocol built on Bitcoin.

## Project Structure

- **Frontend**: A React application for wallet connection and minting
- **Backend**: A Node.js server that creates PSBTs for minting Methane tokens

## How It Works

### Server-Side Integration Flow

1. User connects their OYL wallet through the LaserEyes SDK
2. User clicks "MINT METHANE" button
3. Frontend sends a request to the backend with fee rate and mint data
4. Backend uses OYL SDK to create a properly formatted PSBT for the Alkanes protocol
5. Frontend receives the unsigned PSBT from the server
6. Frontend asks wallet to sign the PSBT
7. After user approval in wallet, frontend broadcasts the signed transaction
8. Transaction is confirmed on Bitcoin blockchain

## Setup and Installation

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start the server
npm start
```

## Testing Locally

1. Start the backend server:
```bash
cd server
npm install
node server.js
```

2. In another terminal, start the frontend:
```bash
npm install
npm start
```

3. Open your browser to the local development server (usually http://localhost:1234)
4. Connect your OYL wallet
5. Click "MINT METHANE" button to test the flow

## Technical Implementation Details

### Frontend Integration

The frontend uses the LaserEyes SDK to handle wallet connection and signing:

```javascript
// Ask wallet to sign the PSBT
const signedPsbt = await window.oyl.signPsbt(unsignedPsbt);

// Broadcast the signed transaction
const txid = await window.oyl.pushPsbt(signedPsbt);
```

### Backend Integration

The backend uses the OYL SDK to create the PSBT:

```javascript
// Create the Alkanes mint PSBT using OYL SDK
const { psbt, psbtHex } = await alkanes.createExecutePsbt({
  gatheredUtxos,
  account,
  protostone,
  provider,
  feeRate
});
```

## Production Deployment

For a production deployment, you would:

1. Deploy the backend server to a cloud provider
2. Build the frontend and deploy to a static hosting service
3. Update the server endpoint in the frontend code to point to your production backend
4. Ensure proper security measures are in place for your backend

## Security Considerations

- Backend server should use HTTPS in production
- Rate limiting should be implemented
- Input validation is essential
- CORS should be properly configured in production