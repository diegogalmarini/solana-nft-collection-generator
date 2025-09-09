import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  Paper,
  Divider,
  Chip,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material';
import {
  Build,
  DataObject,
  Palette,
  Code,
  Security,
  Analytics,
  CloudUpload,
  Download,
  Refresh,
  CheckCircle,
  Error,
  Info,
  Warning
} from '@mui/icons-material';
import MetadataFinalizer from './MetadataFinalizer';

const UtilitiesPage = ({ showNotification }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [hashInput, setHashInput] = useState('');
  const [hashOutput, setHashOutput] = useState('');
  const [hashType, setHashType] = useState('sha256');

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const utilities = [
    {
      title: 'Metadata Finalizer',
      description: 'Replace CIDs in JSON metadata files for final NFT deployment',
      icon: <DataObject />,
      category: 'NFT Tools',
      status: 'Ready'
    },
    {
      title: 'JSON Validator',
      description: 'Validate and format JSON metadata according to NFT standards',
      icon: <CheckCircle />,
      category: 'Validation',
      status: 'Ready'
    },
    {
      title: 'Hash Generator',
      description: 'Generate cryptographic hashes for files and metadata',
      icon: <Security />,
      category: 'Security',
      status: 'Ready'
    },
    {
      title: 'Batch Renamer',
      description: 'Rename multiple files with sequential numbering',
      icon: <Refresh />,
      category: 'File Management',
      status: 'Coming Soon'
    },
    {
      title: 'Image Optimizer',
      description: 'Optimize images for web and IPFS deployment',
      icon: <Palette />,
      category: 'Media',
      status: 'Coming Soon'
    },
    {
      title: 'Contract Deployer',
      description: 'Deploy smart contracts to various blockchain networks',
      icon: <Code />,
      category: 'Blockchain',
      status: 'Coming Soon'
    }
  ];

  const handleJsonValidation = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonOutput(formatted);
      
      // Basic NFT metadata validation
      const errors = [];
      const warnings = [];
      
      if (!parsed.name) errors.push('Missing required field: name');
      if (!parsed.description) errors.push('Missing required field: description');
      if (!parsed.image) errors.push('Missing required field: image');
      
      if (parsed.attributes && !Array.isArray(parsed.attributes)) {
        errors.push('Attributes must be an array');
      }
      
      if (parsed.image && !parsed.image.startsWith('ipfs://') && !parsed.image.startsWith('https://')) {
        warnings.push('Image URL should use IPFS or HTTPS protocol');
      }
      
      setValidationResult({
        valid: errors.length === 0,
        errors,
        warnings,
        fieldCount: Object.keys(parsed).length
      });
      
      showNotification(
        errors.length === 0 ? 'JSON is valid!' : `Found ${errors.length} errors`,
        errors.length === 0 ? 'success' : 'error'
      );
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: [`Invalid JSON: ${error.message}`],
        warnings: [],
        fieldCount: 0
      });
      setJsonOutput('');
      showNotification('Invalid JSON format', 'error');
    }
  };

  const handleHashGeneration = async () => {
    if (!hashInput.trim()) {
      showNotification('Please enter text to hash', 'warning');
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);
      
      let hashBuffer;
      if (hashType === 'sha256') {
        hashBuffer = await crypto.subtle.digest('SHA-256', data);
      } else if (hashType === 'sha1') {
        hashBuffer = await crypto.subtle.digest('SHA-1', data);
      }
      
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setHashOutput(hashHex);
      showNotification('Hash generated successfully!', 'success');
    } catch (error) {
      showNotification('Error generating hash', 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Build sx={{ mr: 2, color: 'primary.main' }} />
        Developer Utilities
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Essential tools and utilities for NFT development, metadata management, and blockchain deployment.
      </Typography>

      <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Tools" />
        <Tab label="Metadata Finalizer" />
        <Tab label="JSON Validator" />
        <Tab label="Hash Generator" />
      </Tabs>

      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {utilities.map((utility, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: utility.status === 'Coming Soon' ? 0.6 : 1
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {utility.icon}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {utility.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {utility.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={utility.category} 
                      size="small" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={utility.status}
                      size="small"
                      color={utility.status === 'Ready' ? 'success' : 'default'}
                    />
                  </Box>
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    disabled={utility.status === 'Coming Soon'}
                    onClick={() => {
                      if (utility.title === 'Metadata Finalizer') setCurrentTab(1);
                      else if (utility.title === 'JSON Validator') setCurrentTab(2);
                      else if (utility.title === 'Hash Generator') setCurrentTab(3);
                    }}
                  >
                    {utility.status === 'Ready' ? 'Open Tool' : 'Coming Soon'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <MetadataFinalizer showNotification={showNotification} />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 1 }} />
            JSON Metadata Validator
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Validate your NFT metadata JSON against standard requirements and get formatting suggestions.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={12}
                label="JSON Input"
                placeholder='{
  "name": "My NFT #1",
  "description": "A unique digital collectible",
  "image": "ipfs://QmHash...",
  "attributes": [
    {
      "trait_type": "Color",
      "value": "Blue"
    }
  ]
}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Button
                variant="contained"
                onClick={handleJsonValidation}
                disabled={!jsonInput.trim()}
                startIcon={<CheckCircle />}
                fullWidth
              >
                Validate JSON
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {validationResult && (
                <Box sx={{ mb: 2 }}>
                  <Alert 
                    severity={validationResult.valid ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                  >
                    {validationResult.valid 
                      ? `Valid NFT metadata with ${validationResult.fieldCount} fields`
                      : `Found ${validationResult.errors.length} errors`
                    }
                  </Alert>
                  
                  {validationResult.errors.length > 0 && (
                    <List dense>
                      {validationResult.errors.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Error color="error" />
                          </ListItemIcon>
                          <ListItemText primary={error} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  
                  {validationResult.warnings.length > 0 && (
                    <List dense>
                      {validationResult.warnings.map((warning, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Warning color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={warning} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
              
              {jsonOutput && (
                <>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="Formatted JSON"
                    value={jsonOutput}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="outlined"
                    onClick={() => copyToClipboard(jsonOutput)}
                    startIcon={<Download />}
                    fullWidth
                  >
                    Copy Formatted JSON
                  </Button>
                </>
              )}
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Security sx={{ mr: 1 }} />
            Cryptographic Hash Generator
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Generate secure hashes for files, metadata, or any text content using industry-standard algorithms.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Hash Algorithm</InputLabel>
                <Select
                  value={hashType}
                  label="Hash Algorithm"
                  onChange={(e) => setHashType(e.target.value)}
                >
                  <MenuItem value="sha256">SHA-256</MenuItem>
                  <MenuItem value="sha1">SHA-1</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Text to Hash"
                placeholder="Enter any text, JSON, or file content to generate a hash..."
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Button
                variant="contained"
                onClick={handleHashGeneration}
                disabled={!hashInput.trim()}
                startIcon={<Security />}
                fullWidth
              >
                Generate Hash
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {hashOutput && (
                <>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Hash generated successfully using {hashType.toUpperCase()}
                  </Alert>
                  
                  <TextField
                    fullWidth
                    label="Generated Hash"
                    value={hashOutput}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="outlined"
                    onClick={() => copyToClipboard(hashOutput)}
                    startIcon={<Download />}
                    fullWidth
                  >
                    Copy Hash
                  </Button>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Hash Length:</strong> {hashOutput.length} characters<br/>
                      <strong>Algorithm:</strong> {hashType.toUpperCase()}<br/>
                      <strong>Use Case:</strong> File integrity verification, unique identifiers
                    </Typography>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>
    </Box>
  );
};

export default UtilitiesPage;