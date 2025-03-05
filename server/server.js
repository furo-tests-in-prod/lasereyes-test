const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bitcoin = require('bitcoinjs-lib');

// Import our OYL SDK integration
const { createAlkanesMintPSBT } = require('./oyl-sdk-integration');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API endpoint to create a mint PSBT
app.post('/api/create-mint-psbt', async (req, res) => {
  try {
    const { feeRate, mintData } = req.body;
    
    // Validate inputs
    if (!feeRate || !mintData) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Please provide feeRate and mintData.' 
      });
    }
    
    console.log(`Received request to create mint PSBT with fee rate ${feeRate} and data ${mintData}`);
    
    // Create the PSBT with our OYL SDK integration
    const result = await createAlkanesMintPSBT(feeRate, mintData);
    
    console.log("PSBT created successfully:", result.psbt.substring(0, 30) + "...");
    
    // Return the PSBT to the client
    return res.status(200).json({
      success: true,
      psbt: result.psbt,
      message: 'PSBT created successfully'
    });
  } catch (error) {
    console.error('API error:', error);
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

// Start the server
app.listen(port, () => {
  console.log(`Methane mint server running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api/create-mint-psbt`);
  console.log(`Health check at http://localhost:${port}/health`);
});