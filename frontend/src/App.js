import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import CollectionDetails from './components/CollectionDetails';
import RarityPlan from './components/RarityPlan';
import AdvancedOptions from './components/AdvancedOptions';
import axios from 'axios';
import { saveAs } from 'file-saver';

const theme = createTheme({
  palette: {
    primary: {
      main: '#9c27b0',
    },
    secondary: {
      main: '#ff9800',
    },
  },
});

function App() {
  const [collectionData, setCollectionData] = useState({
    projectName: '',
    symbol: '',
    description: '',
    externalUrl: '',
    royaltyFee: 300,
    creatorWallet: '',
    creatorShare: 100,
    collectionNumber: '',
    season: '',
    seriesSlug: ''
  });

  const [rarityTiers, setRarityTiers] = useState([]);
  const [totalSupply, setTotalSupply] = useState(0);
  const [advancedOptions, setAdvancedOptions] = useState({
    randomizeOrder: false,
    calculateColorPalette: false,
    calculateSHA256: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    // Validate collection details
    if (!collectionData.projectName || !collectionData.symbol || !collectionData.description) {
      setError('Please fill in all required collection details.');
      return false;
    }

    if (collectionData.symbol.length > 5) {
      setError('Symbol must be 5 characters or less.');
      return false;
    }

    // Validate total supply
    if (totalSupply <= 0) {
      setError('Total supply must be greater than 0.');
      return false;
    }

    // Validate rarity tiers
    if (rarityTiers.length === 0) {
      setError('Please add at least one rarity tier.');
      return false;
    }

    // Check if sum of NFTs equals total supply
    const totalNFTs = rarityTiers.reduce((sum, tier) => sum + tier.numberOfNFTs, 0);
    if (totalNFTs !== totalSupply) {
      setError(`Sum of NFTs in all tiers (${totalNFTs}) must equal total supply (${totalSupply}).`);
      return false;
    }

    // Validate each tier has uploaded files
    for (let tier of rarityTiers) {
      if (!tier.files || tier.files.length === 0) {
        setError(`Please upload images for the ${tier.rarityTier} tier.`);
        return false;
      }

      const expectedFiles = tier.rarityTier === '1/1' ? tier.numberOfNFTs : 
                           Math.ceil(tier.numberOfNFTs / tier.editionsPerImage);
      
      if (tier.files.length !== expectedFiles) {
        setError(`${tier.rarityTier} tier requires exactly ${expectedFiles} image files.`);
        return false;
      }
    }

    return true;
  };

  const handleGenerate = async () => {
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      // Add collection data
      formData.append('collectionData', JSON.stringify(collectionData));
      formData.append('totalSupply', totalSupply);
      formData.append('advancedOptions', JSON.stringify(advancedOptions));
      formData.append('rarityTiers', JSON.stringify(rarityTiers.map(tier => ({
        ...tier,
        files: undefined // Remove files from JSON, they'll be added separately
      }))));

      // Add files
      rarityTiers.forEach((tier, tierIndex) => {
        tier.files.forEach((file, fileIndex) => {
          formData.append(`tier_${tierIndex}_file_${fileIndex}`, file);
        });
      });

      const response = await axios.post('/api/generate-collection', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob'
      });

      // Download the generated ZIP file
      const blob = new Blob([response.data], { type: 'application/zip' });
      saveAs(blob, `${collectionData.projectName.replace(/\s+/g, '_')}_NFT_Collection.zip`);
      
      setSuccess('Collection generated successfully! Download started.');
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
          Solana NFT Collection Generator
        </Typography>
        <Typography variant="h6" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
          Direct Image Mode - Generate Metaplex-compliant metadata for your pre-made art
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Section 1: Collection Details */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom color="primary">
            1. Collection Details
          </Typography>
          <CollectionDetails 
            data={collectionData} 
            onChange={setCollectionData} 
          />
        </Paper>

        {/* Section 2: Rarity Plan & Image Uploader */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom color="primary">
            2. Rarity Plan & Image Upload
          </Typography>
          <RarityPlan 
            totalSupply={totalSupply}
            onTotalSupplyChange={setTotalSupply}
            rarityTiers={rarityTiers}
            onRarityTiersChange={setRarityTiers}
          />
        </Paper>

        {/* Section 3: Advanced Options & Action */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom color="primary">
            3. Advanced Options
          </Typography>
          <AdvancedOptions 
            options={advancedOptions}
            onChange={setAdvancedOptions}
          />
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGenerate}
              disabled={loading}
              sx={{ 
                px: 6, 
                py: 2, 
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #9c27b0 30%, #ff9800 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #7b1fa2 30%, #f57c00 90%)',
                }
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  Generating Collection...
                </>
              ) : (
                'GENERATE COLLECTION'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;