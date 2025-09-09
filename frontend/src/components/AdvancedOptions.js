import React from 'react';
import {
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Shuffle, Palette, Security } from '@mui/icons-material';

const AdvancedOptions = ({ options, onChange }) => {
  const handleChange = (field) => (event) => {
    onChange({
      ...options,
      [field]: event.target.checked
    });
  };

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure additional processing options for your NFT collection.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Shuffle color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  Randomization
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.randomizeOrder}
                    onChange={handleChange('randomizeOrder')}
                    color="primary"
                  />
                }
                label="Randomize Output Order"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Shuffle the final numbered NFTs to randomize the distribution order. This prevents predictable patterns in the collection.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Palette color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  Color Analysis
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.calculateColorPalette}
                    onChange={handleChange('calculateColorPalette')}
                    color="primary"
                  />
                }
                label="Calculate Color Palette"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Extract dominant colors from each image and add them as metadata attributes (palette_primary, palette_secondary).
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  Security Hash
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.calculateSHA256}
                    onChange={handleChange('calculateSHA256')}
                    color="primary"
                  />
                }
                label="Calculate SHA256 Hash"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Generate SHA256 hash for each image file and include it in the metadata for verification and authenticity.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" color="info.contrastText">
          <strong>Note:</strong> Advanced options may increase processing time. Color palette extraction and SHA256 hashing require additional computation for each image.
        </Typography>
      </Box>
    </Box>
  );
};

export default AdvancedOptions;