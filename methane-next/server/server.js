require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

// Import our OYL SDK integration
const { createAlkanesMintPSBT } = require('./oyl-sdk-integration');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev')); // Add request logging

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Methane Mint API',
    version: '1.0.0',
    description: 'API for minting Methane tokens on the Alkanes metaprotocol',
    endpoints: [
      {
        path: '/api/create-mint-psbt',
        method: 'POST',
        description: 'Create a PSBT for minting Methane tokens',
        params: {
          feeRate: 'number - Fee rate in sat/vB',
          mintData: 'string - Mint data in format "2,1,77"',
          userAddress: 'string - User\'s taproot address'
        }
      },
      {
        path: '/health',
        method: 'GET',
        description: 'Health check endpoint'
      }
    ]
  });
});

// API endpoint to create a mint PSBT
app.post('/api/create-mint-psbt', async (req, res) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Received mint request`);
  
  try {
    const { feeRate, mintData, userAddress } = req.body;
    
    // Log request details
    console.log(`Request details:
  - Fee Rate: ${feeRate} sat/vB
  - Mint Data: ${mintData}
  - User Address: ${userAddress}
`);
    
    // Validate inputs
    if (!feeRate || !mintData || !userAddress) {
      console.log(`[${new Date().toISOString()}] Validation error: Missing parameters`);
      return res.status(400).json({ 
        success: false,
        error: 'Missing required parameters. Please provide feeRate, mintData, and userAddress.' 
      });
    }
    
    // Create the PSBT with our OYL SDK integration
    console.log(`[${new Date().toISOString()}] Creating PSBT...`);
    const result = await createAlkanesMintPSBT(feeRate, mintData, userAddress);
    
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] PSBT created successfully in ${duration}ms`);
    console.log(`PSBT: ${result.psbt.substring(0, 30)}...`);
    
    // Return the PSBT to the client with format information
    return res.status(200).json({
      success: true,
      psbt: result.psbt,
      format: result.format || "hex",
      message: 'PSBT created successfully'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] API error after ${duration}ms:`, error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Methane mint server running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api/create-mint-psbt`);
  console.log(`Health check at http://localhost:${port}/health`);
});
