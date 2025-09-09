import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload,
  Download,
  Delete,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import MetadataFinalizer from '../utils/MetadataFinalizer';

const MetadataFinalizerComponent = () => {
  const [metadataFiles, setMetadataFiles] = useState([]);
  const [cidMappings, setCidMappings] = useState({});
  const [placeholders, setPlaceholders] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState([]);
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [newCid, setNewCid] = useState('');

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const metadata = JSON.parse(e.target.result);
            const fileData = {
              id: Date.now() + Math.random(),
              name: file.name,
              metadata,
              originalSize: file.size
            };
            
            setMetadataFiles(prev => [...prev, fileData]);
            
            // Extract placeholders from this file
            const filePlaceholders = MetadataFinalizer.extractPlaceholders(metadata);
            setPlaceholders(prev => new Set([...prev, ...filePlaceholders]));
            
          } catch (error) {
            console.error('Error parsing JSON file:', error);
          }
        };
        reader.readAsText(file);
      }
    });
    
    // Reset file input
    event.target.value = '';
  };

  // Add CID mapping
  const addCidMapping = () => {
    if (newPlaceholder && newCid) {
      setCidMappings(prev => ({
        ...prev,
        [newPlaceholder]: newCid
      }));
      setNewPlaceholder('');
      setNewCid('');
    }
  };

  // Remove CID mapping
  const removeCidMapping = (placeholder) => {
    setCidMappings(prev => {
      const updated = { ...prev };
      delete updated[placeholder];
      return updated;
    });
  };

  // Remove metadata file
  const removeMetadataFile = (fileId) => {
    setMetadataFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Validate all metadata files
  const validateMetadata = () => {
    const results = metadataFiles.map(file => ({
      fileId: file.id,
      fileName: file.name,
      ...MetadataFinalizer.validateMetadata(file.metadata)
    }));
    setValidationResults(results);
  };

  // Process and finalize metadata
  const finalizeMetadata = async () => {
    if (metadataFiles.length === 0) {
      alert('Please upload metadata files first');
      return;
    }

    if (Object.keys(cidMappings).length === 0) {
      alert('Please add CID mappings first');
      return;
    }

    setProcessing(true);

    try {
      // Process each file
      const finalizedFiles = metadataFiles.map(file => {
        const finalizedMetadata = MetadataFinalizer.replaceCIDs(file.metadata, cidMappings);
        return {
          ...file,
          finalizedMetadata
        };
      });

      // Download each finalized file
      finalizedFiles.forEach(file => {
        const filename = file.name.replace('.json', '_finalized.json');
        MetadataFinalizer.downloadMetadata(file.finalizedMetadata, filename);
      });

      // If multiple files, also create a batch download
      if (finalizedFiles.length > 1) {
        const batchMetadata = finalizedFiles.map(file => file.finalizedMetadata);
        MetadataFinalizer.downloadMetadata(batchMetadata, 'batch_finalized_metadata.json');
      }

    } catch (error) {
      console.error('Error finalizing metadata:', error);
      alert('Error processing metadata files');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Metadata Finalizer
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload your NFT metadata JSON files and replace placeholder CIDs with actual IPFS CIDs.
      </Typography>

      <Grid container spacing={3}>
        {/* File Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Metadata Files
            </Typography>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Choose JSON Files
              <input
                type="file"
                hidden
                multiple
                accept=".json"
                onChange={handleFileUpload}
              />
            </Button>

            {metadataFiles.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Uploaded Files ({metadataFiles.length})
                </Typography>
                <List dense>
                  {metadataFiles.map(file => (
                    <ListItem
                      key={file.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => removeMetadataFile(file.id)}
                        >
                          <Delete />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.originalSize / 1024).toFixed(1)} KB`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        </Grid>

        {/* CID Mapping Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              CID Mappings
            </Typography>
            
            {placeholders.size > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Found placeholders: {Array.from(placeholders).join(', ')}
                </Typography>
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Placeholder"
                  value={newPlaceholder}
                  onChange={(e) => setNewPlaceholder(e.target.value)}
                  placeholder="e.g., {{IMAGE_CID}}"
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Actual CID"
                  value={newCid}
                  onChange={(e) => setNewCid(e.target.value)}
                  placeholder="e.g., QmXXXXXX..."
                />
              </Grid>
              <Grid item xs={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={addCidMapping}
                  disabled={!newPlaceholder || !newCid}
                >
                  Add
                </Button>
              </Grid>
            </Grid>

            {Object.keys(cidMappings).length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Current Mappings
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(cidMappings).map(([placeholder, cid]) => (
                    <Chip
                      key={placeholder}
                      label={`${placeholder} → ${cid.substring(0, 10)}...`}
                      onDelete={() => removeCidMapping(placeholder)}
                      size="small"
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Validation Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Validation & Processing
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  onClick={validateMetadata}
                  disabled={metadataFiles.length === 0}
                  sx={{ mr: 1 }}
                >
                  Validate
                </Button>
                <Button
                  variant="contained"
                  onClick={finalizeMetadata}
                  disabled={processing || metadataFiles.length === 0 || Object.keys(cidMappings).length === 0}
                  startIcon={<Download />}
                >
                  {processing ? 'Processing...' : 'Finalize & Download'}
                </Button>
              </Box>
            </Box>

            {processing && <LinearProgress sx={{ mb: 2 }} />}

            {validationResults.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Validation Results
                </Typography>
                <Grid container spacing={2}>
                  {validationResults.map(result => (
                    <Grid item xs={12} sm={6} md={4} key={result.fileId}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {result.isValid ? (
                              <CheckCircle color="success" sx={{ mr: 1 }} />
                            ) : (
                              <Error color="error" sx={{ mr: 1 }} />
                            )}
                            <Typography variant="subtitle2" noWrap>
                              {result.fileName}
                            </Typography>
                          </Box>
                          {!result.isValid && (
                            <List dense>
                              {result.errors.map((error, index) => (
                                <ListItem key={index} sx={{ py: 0 }}>
                                  <ListItemText
                                    primary={error}
                                    primaryTypographyProps={{ variant: 'caption', color: 'error' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Paper>
        </Grid>

        {/* Instructions */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Instructions:</strong>
              <br />1. Upload your metadata JSON files containing placeholder CIDs
              <br />2. Add mappings from placeholders to actual IPFS CIDs
              <br />3. Validate your metadata structure (optional)
              <br />4. Click "Finalize & Download" to get updated files with real CIDs
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MetadataFinalizerComponent;