import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

const RarityTierCard = ({ tier, index, onUpdate, onDelete }) => {
  const handleChange = (field) => (event) => {
    const value = event.target.type === 'number' ? 
      parseInt(event.target.value) || 0 : 
      event.target.value;
    
    onUpdate(index, {
      ...tier,
      [field]: value
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: (acceptedFiles) => {
      onUpdate(index, {
        ...tier,
        files: acceptedFiles
      });
    }
  });

  const expectedFiles = tier.rarityTier === '1/1' ? tier.numberOfNFTs : 
                       Math.ceil(tier.numberOfNFTs / (tier.editionsPerImage || 1));

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="primary">
            Rarity Tier {index + 1}
          </Typography>
          <IconButton onClick={() => onDelete(index)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Rarity Tier</InputLabel>
              <Select
                value={tier.rarityTier}
                onChange={handleChange('rarityTier')}
                label="Rarity Tier"
              >
                <MenuItem value="1/1">1/1 (Unique)</MenuItem>
                <MenuItem value="limited">Limited Edition</MenuItem>
                <MenuItem value="common">Common</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Number of NFTs"
              value={tier.numberOfNFTs}
              onChange={handleChange('numberOfNFTs')}
              type="number"
              inputProps={{ min: 1 }}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Editions per Image"
              value={tier.editionsPerImage}
              onChange={handleChange('editionsPerImage')}
              type="number"
              inputProps={{ min: 1 }}
              disabled={tier.rarityTier === '1/1'}
              required={tier.rarityTier !== '1/1'}
              helperText={tier.rarityTier === '1/1' ? 'Always 1 for unique items' : 'How many copies per image'}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Art ID Prefix"
              value={tier.artIdPrefix}
              onChange={handleChange('artIdPrefix')}
              placeholder="e.g., rare-"
              helperText="Optional prefix for art tracking"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop images here...' : 'Drag & drop images or click to browse'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expected: {expectedFiles} image files (PNG, JPG, JPEG)
              </Typography>
              
              {tier.files && tier.files.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Uploaded Files ({tier.files.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {tier.files.map((file, fileIndex) => (
                      <Chip
                        key={fileIndex}
                        label={file.name}
                        size="small"
                        color={tier.files.length === expectedFiles ? 'success' : 'warning'}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
            
            {tier.files && tier.files.length !== expectedFiles && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Expected {expectedFiles} files, but {tier.files.length} uploaded.
              </Alert>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const RarityPlan = ({ totalSupply, onTotalSupplyChange, rarityTiers, onRarityTiersChange }) => {
  const addRarityTier = () => {
    const newTier = {
      rarityTier: 'common',
      numberOfNFTs: 0,
      editionsPerImage: 1,
      artIdPrefix: '',
      files: []
    };
    onRarityTiersChange([...rarityTiers, newTier]);
  };

  const updateTier = (index, updatedTier) => {
    const newTiers = [...rarityTiers];
    newTiers[index] = updatedTier;
    onRarityTiersChange(newTiers);
  };

  const deleteTier = (index) => {
    const newTiers = rarityTiers.filter((_, i) => i !== index);
    onRarityTiersChange(newTiers);
  };

  const totalNFTs = rarityTiers.reduce((sum, tier) => sum + (tier.numberOfNFTs || 0), 0);
  const supplyMatch = totalNFTs === totalSupply && totalSupply > 0;

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Define your collection's total supply and break it down into rarity tiers. Upload the corresponding artwork for each tier.
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Total Supply"
            value={totalSupply}
            onChange={(e) => onTotalSupplyChange(parseInt(e.target.value) || 0)}
            type="number"
            inputProps={{ min: 1 }}
            required
            helperText="Total number of NFTs in your collection"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Alert 
              severity={supplyMatch ? 'success' : totalNFTs > totalSupply ? 'error' : 'warning'}
              sx={{ width: '100%' }}
            >
              {supplyMatch ? 
                `✓ Supply matches: ${totalNFTs} NFTs` :
                `Supply mismatch: ${totalNFTs} NFTs planned vs ${totalSupply} total supply`
              }
            </Alert>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addRarityTier}
          sx={{ mb: 2 }}
        >
          Add Rarity Tier
        </Button>
        
        {rarityTiers.length === 0 && (
          <Alert severity="info">
            Click "Add Rarity Tier" to start defining your collection structure.
          </Alert>
        )}
      </Box>

      {rarityTiers.map((tier, index) => (
        <RarityTierCard
          key={index}
          tier={tier}
          index={index}
          onUpdate={updateTier}
          onDelete={deleteTier}
        />
      ))}
    </Box>
  );
};

export default RarityPlan;