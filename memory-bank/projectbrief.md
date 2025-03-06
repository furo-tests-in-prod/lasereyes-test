# Project Brief: Methane

## Overview
Methane is a memecoin built on the Alkanes metaprotocol on Bitcoin. The project consists of a Next.js frontend application and an Express backend server that work together to allow users to mint Methane tokens.

## Core Requirements

1. **Wallet Integration**
   - Connect to OYL wallet via LaserEyes SDK
   - Retrieve user's Bitcoin address
   - Sign and broadcast transactions
   - Provide wallet connection status feedback

2. **Minting Functionality**
   - Create properly formatted PSBTs for the Alkanes protocol
   - Allow users to set custom fee rates
   - Execute minting operations on the Bitcoin blockchain
   - Handle transaction errors gracefully

3. **User Experience**
   - Simple, intuitive interface
   - Clear feedback on transaction status
   - Visual design with gas bubble animation theme
   - Responsive design for various devices

## Technical Goals

1. **Frontend**
   - Next.js application with TypeScript
   - Component-based architecture
   - Responsive design with Tailwind CSS
   - Wallet connection management
   - Transaction signing and broadcasting

2. **Backend**
   - Express server for PSBT creation
   - OYL SDK integration
   - Enhanced logging and error handling
   - Environment variable configuration

## Project Scope

The project has progressed from a prototype to a development stage with a modern architecture and improved code organization. The application now uses Next.js with TypeScript for the frontend and has a more structured component architecture. The backend has been enhanced with better logging and error handling. However, the project still requires further refinement before production readiness, particularly in replacing the mock implementation with actual OYL SDK integration and improving the user experience.

## Success Criteria

1. Users can connect their OYL wallet
2. Users can set custom fee rates
3. Users can mint Methane tokens
4. Transactions are properly formatted for the Alkanes protocol
5. Transactions are successfully broadcast to the Bitcoin network
6. The application provides clear feedback throughout the process
7. The application works well on both desktop and mobile devices
