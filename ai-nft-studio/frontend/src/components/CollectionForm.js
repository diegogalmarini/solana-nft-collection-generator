import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Slider,
  FormHelperText,
  Chip
} from '@mui/material';
import {
  Settings,
  Collections,
  Save,
  AutoAwesome,
  AttachMoney
} from '@mui/icons-material';
import axios from 'axios';

const CollectionForm = ({ generatedMetadata, onCollectionCreated, showNotification }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbol: '',
    collection_number: 100,
    art_prompt: '',
    style: 'realistic',
    batch_size: 10,
    external_url: 'https://mintonaire.io',
    seller_fee_basis_points: 500, // 5%
    creators: [{
      address: '',
      share: 100
    }]
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState({});

  // AI Cost estimation (approximate costs per image)
  const AI_COST_PER_IMAGE = 0.05; // $0.05 per image
  const calculateEstimatedCost = () => {
    return (formData.collection_number * AI_COST_PER_IMAGE).toFixed(2);
  };

  const getEstimatedTime = () => {
    const imagesPerMinute = 2; // Approximate generation speed
    const totalMinutes = Math.ceil(formData.collection_number / imagesPerMinute);
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const styleOptions = [
    { value: 'realistic', label: 'Realistic' },
    { value: 'cartoon', label: 'Cartoon/Anime' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'pixel-art', label: 'Pixel Art' },
    { value: 'oil-painting', label: 'Oil Painting' },
    { value: 'watercolor', label: 'Watercolor' },
    { value: 'digital-art', label: 'Digital Art' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'minimalist', label: 'Minimalist' }
  ];

  // Auto-fill form when metadata is generated
  useEffect(() => {
    if (generatedMetadata) {
      setFormData(prev => ({
        ...prev,
        name: generatedMetadata.name || '',
        description: generatedMetadata.description || '',
        symbol: generatedMetadata.symbol || '',
        art_prompt: generatedMetadata.art_prompt || ''
      }));
    }
  }, [generatedMetadata]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSliderChange = (field) => (event, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreatorAddressChange = (event) => {
    const address = event.target.value;
    setFormData(prev => ({
      ...prev,
      creators: [{
        address,
        share: 100
      }]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Collection name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be 10 characters or less';
    }
    
    if (!formData.art_prompt.trim()) {
      newErrors.art_prompt = 'Art prompt is required';
    }
    
    if (formData.collection_number < 1 || formData.collection_number > 10000) {
      newErrors.collection_number = 'Collection size must be between 1 and 10,000';
    }
    
    if (formData.batch_size < 1 || formData.batch_size > 50) {
      newErrors.batch_size = 'Batch size must be between 1 and 50';
    }
    
    if (formData.creators[0].address && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(formData.creators[0].address)) {
      newErrors.creator_address = 'Invalid Solana wallet address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      showNotification('Please fix the form errors', 'error');
      return;
    }
    
    setIsCreating(true);
    try {
      const response = await axios.post('/api/collections', formData);
      const collection = response.data.collection;
      
      onCollectionCreated(collection);
      showNotification(`Collection "${collection.name}" created successfully!`, 'success');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        symbol: '',
        collection_number: 100,
        art_prompt: '',
        style: 'realistic',
        batch_size: 10,
        external_url: 'https://mintonaire.io',
        seller_fee_basis_points: 500,
        creators: [{
          address: '',
          share: 100
        }]
      });
    } catch (error) {
      console.error('Error creating collection:', error);
      showNotification(
        error.response?.data?.error || 'Failed to create collection. Please try again.',
        'error'
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Settings sx={{ mr: 2, color: 'primary.main' }} />
        Collection Configuration
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure your NFT collection details. Use the AI-generated metadata or customize everything to your needs.
      </Typography>

      {generatedMetadata && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Form has been pre-filled with AI-generated metadata. You can modify any field as needed.
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Collections sx={{ mr: 1 }} />
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Collection Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="e.g., Cyberpunk Robots"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Symbol"
                value={formData.symbol}
                onChange={handleInputChange('symbol')}
                error={!!errors.symbol}
                helperText={errors.symbol || 'Short identifier (max 10 chars)'}
                placeholder="e.g., CYBORG"
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                error={!!errors.description}
                helperText={errors.description}
                placeholder="Describe your NFT collection..."
              />
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Art Configuration */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AutoAwesome sx={{ mr: 1 }} />
                Art Configuration
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Art Prompt"
                value={formData.art_prompt}
                onChange={handleInputChange('art_prompt')}
                error={!!errors.art_prompt}
                helperText={errors.art_prompt || 'Detailed description for AI image generation'}
                placeholder="Detailed art prompt for generating unique NFT images..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Art Style</InputLabel>
                <Select
                  value={formData.style}
                  onChange={handleInputChange('style')}
                  label="Art Style"
                >
                  {styleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="External URL"
                value={formData.external_url}
                onChange={handleInputChange('external_url')}
                placeholder="https://mintonaire.io"
                helperText="Website or marketplace URL"
              />
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Generation Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Generation Settings
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Collection Size: {formData.collection_number}</Typography>
              <Slider
                value={formData.collection_number}
                onChange={handleSliderChange('collection_number')}
                min={1}
                max={10000}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 100, label: '100' },
                  { value: 1000, label: '1K' },
                  { value: 10000, label: '10K' }
                ]}
                valueLabelDisplay="auto"
              />
              <FormHelperText>Total number of NFTs to generate</FormHelperText>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Batch Size: {formData.batch_size}</Typography>
              <Slider
                value={formData.batch_size}
                onChange={handleSliderChange('batch_size')}
                min={1}
                max={50}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 10, label: '10' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' }
                ]}
                valueLabelDisplay="auto"
              />
              <FormHelperText>Images to generate per batch</FormHelperText>
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Cost Estimation */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ mr: 1 }} />
                Cost Estimation
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                          ${calculateEstimatedCost()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Estimated AI Cost
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                          {getEstimatedTime()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Estimated Time
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip 
                          label={`${formData.collection_number} images`} 
                          color="primary" 
                          variant="outlined" 
                          size="small"
                        />
                        <Chip 
                          label={`$${AI_COST_PER_IMAGE} per image`} 
                          color="secondary" 
                          variant="outlined" 
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          * Costs are estimates and may vary
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Royalty Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Royalty Settings
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Royalty: {(formData.seller_fee_basis_points / 100).toFixed(1)}%</Typography>
              <Slider
                value={formData.seller_fee_basis_points}
                onChange={handleSliderChange('seller_fee_basis_points')}
                min={0}
                max={1000}
                step={25}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 250, label: '2.5%' },
                  { value: 500, label: '5%' },
                  { value: 750, label: '7.5%' },
                  { value: 1000, label: '10%' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value / 100).toFixed(1)}%`}
              />
              <FormHelperText>Royalty percentage for secondary sales</FormHelperText>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Creator Wallet Address (Optional)"
                value={formData.creators[0].address}
                onChange={handleCreatorAddressChange}
                error={!!errors.creator_address}
                helperText={errors.creator_address || 'Solana wallet address for royalties'}
                placeholder="e.g., 11111111111111111111111111111112"
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isCreating}
                  startIcon={isCreating ? <CircularProgress size={20} /> : <Save />}
                  sx={{ minWidth: 200 }}
                >
                  {isCreating ? 'Creating Collection...' : 'Create Collection'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CollectionForm;