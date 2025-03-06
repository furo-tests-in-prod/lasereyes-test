# Technical Context: Methane

## Technologies Used

### Frontend

- **Next.js**: React framework for production
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **LaserEyes SDK**: SDK for OYL wallet integration (`@omnisat/lasereyes`)
- **ESLint**: JavaScript linting utility
- **Postcss**: Tool for transforming CSS with JavaScript

### Backend

- **Node.js**: JavaScript runtime for server-side code
- **Express.js**: Web framework for Node.js
- **bitcoinjs-lib**: Library for Bitcoin operations
- **cors**: Middleware for enabling CORS
- **body-parser**: Middleware for parsing request bodies
- **dotenv**: Module for loading environment variables
- **morgan**: HTTP request logger middleware

## Development Setup

### Frontend

```json
{
  "name": "methane-next",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev:frontend": "next dev",
    "dev:server": "cd server && npm run dev",
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:server\"",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@omnisat/lasereyes": "^0.0.140",
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "concurrently": "^8.2.2",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
```

### Backend

```json
{
  "name": "methane-mint-server",
  "version": "1.0.0",
  "description": "Backend server for Methane token minting",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "bitcoinjs-lib": "^6.1.3",
    "body-parser": "^1.20.2",
    "dotenv": "^16.0.3",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

## Technical Constraints

### OYL Wallet Integration

- **Wallet API Compatibility**: The OYL wallet must support the methods defined in the TypeScript interface
- **LaserEyes SDK Version**: The application depends on specific features of the LaserEyes SDK
- **Transaction Signing**: The wallet must support PSBT signing for the Alkanes protocol

### Alkanes Protocol

- **Protocol Format**: Transactions must follow the specific format required by the Alkanes protocol
- **Fee Rates**: Transactions must include appropriate fee rates for Bitcoin network confirmation
- **PSBT Creation**: The backend must create properly formatted PSBTs for the Alkanes protocol

### Bitcoin Network

- **Transaction Confirmation**: Bitcoin network congestion can affect transaction confirmation times
- **Fee Market**: Fee rates must be adjusted based on current network conditions
- **Transaction Size**: The size of the transaction affects the total fee

## Dependencies

### External Services

- **OYL Wallet**: External wallet service that must be installed by the user
- **Bitcoin Network**: Public blockchain network for transaction broadcasting
- **Alkanes Protocol**: Metaprotocol built on Bitcoin for token operations

### SDK Dependencies

- **LaserEyes SDK**: Provides wallet connection and transaction functionality
- **OYL SDK**: Used on the backend for PSBT creation (currently mocked)

## Development Workflow

1. **Local Development**:
   - Start both frontend and backend: `npm run dev`
   - Start only the frontend: `npm run dev:frontend`
   - Start only the backend: `npm run dev:server`
   - Access the application at `http://localhost:3000`

2. **Testing**:
   - Connect OYL wallet
   - Test minting functionality
   - Verify transaction creation and signing
   - Run linting: `npm run lint`

3. **Production Deployment**:
   - Build the Next.js application: `npm run build`
   - Start the production server: `npm start`
   - Deploy the backend to a cloud provider
   - Deploy the frontend to a Next.js-compatible hosting service
   - Update API endpoints to production URLs

## Technical Debt

1. **Mock Implementation**: The backend still uses a mock implementation instead of the actual OYL SDK integration
2. **Alert Dialogs**: The application uses browser alert dialogs instead of proper UI components for notifications
3. **Error Handling**: While improved, error handling could be more comprehensive
4. **Testing**: The application lacks automated tests
5. **Environment Variables**: Some environment variables may need better documentation and validation
6. **API Type Safety**: The API client could benefit from stronger type definitions for requests and responses
