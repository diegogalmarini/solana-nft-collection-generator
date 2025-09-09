import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box
} from '@mui/material';

const CollectionDetails = ({ data, onChange }) => {
  const handleChange = (field) => (event) => {
    const value = event.target.type === 'number' ? 
      parseInt(event.target.value) || 0 : 
      event.target.value;
    
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure the general metadata that will apply to your entire NFT collection.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Project Name (Base)"
            value={data.projectName}
            onChange={handleChange('projectName')}
            placeholder="e.g., My Collection"
            required
            helperText="Base name for your NFT collection"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Symbol"
            value={data.symbol}
            onChange={handleChange('symbol')}
            placeholder="e.g., MYCO"
            required
            inputProps={{ maxLength: 5 }}
            helperText="Max 5 characters"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={data.description}
            onChange={handleChange('description')}
            multiline
            rows={3}
            placeholder="Describe your NFT collection..."
            required
            helperText="Collection description for metadata"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="External URL (Base)"
            value={data.externalUrl}
            onChange={handleChange('externalUrl')}
            placeholder="https://yourwebsite.com"
            type="url"
            helperText="Website or landing page for your collection"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Royalty Fee (Basis Points)"
            value={data.royaltyFee}
            onChange={handleChange('royaltyFee')}
            type="number"
            inputProps={{ min: 0, max: 10000 }}
            helperText="300 = 3% royalty (max 10000 = 100%)"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Creator Wallet Address"
            value={data.creatorWallet}
            onChange={handleChange('creatorWallet')}
            placeholder="Solana wallet address"
            required
            helperText="Solana wallet address for royalties"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Creator Share"
            value={data.creatorShare}
            onChange={handleChange('creatorShare')}
            type="number"
            inputProps={{ min: 0, max: 100 }}
            helperText="Percentage of royalties (usually 100)"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Collection Number"
            value={data.collectionNumber}
            onChange={handleChange('collectionNumber')}
            placeholder="e.g., 2025-W07"
            helperText="Internal collection identifier"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Season"
            value={data.season}
            onChange={handleChange('season')}
            placeholder="e.g., Winter 2025"
            helperText="Season or period identifier"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Series Slug"
            value={data.seriesSlug}
            onChange={handleChange('seriesSlug')}
            placeholder="e.g., art-series-alpha"
            helperText="URL-friendly series identifier"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CollectionDetails;