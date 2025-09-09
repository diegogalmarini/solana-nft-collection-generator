import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Collections,
  Visibility,
  Delete,
  Download,
  MoreVert,
  Info,
  Work,
  GetApp
} from '@mui/icons-material';
import axios from 'axios';

const CollectionList = ({ onCollectionSelected, showNotification }) => {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuCollection, setMenuCollection] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/collections');
      setCollections(response.data.collections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      showNotification('Failed to fetch collections', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (collection) => {
    setSelectedCollection(collection);
    setDetailsOpen(true);
  };

  const handleSelectCollection = (collection) => {
    onCollectionSelected(collection);
    showNotification(`Selected collection: ${collection.name}`, 'info');
  };

  const handleDeleteCollection = async (collectionId) => {
    try {
      await axios.delete(`/api/collections/${collectionId}`);
      showNotification('Collection deleted successfully', 'success');
      fetchCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      showNotification(
        error.response?.data?.error || 'Failed to delete collection',
        'error'
      );
    }
    handleCloseMenu();
  };

  const handleDownloadPackage = async (collectionId) => {
    try {
      const response = await axios.get(`/api/collections/${collectionId}/download`);
      if (response.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
        showNotification('Download started', 'success');
      } else {
        showNotification('No package available for download', 'warning');
      }
    } catch (error) {
      console.error('Error downloading package:', error);
      showNotification(
        error.response?.data?.error || 'Failed to download package',
        'error'
      );
    }
    handleCloseMenu();
  };

  const handleOpenMenu = (event, collection) => {
    setMenuAnchor(event.currentTarget);
    setMenuCollection(collection);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuCollection(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProgress = (collection) => {
    if (!collection.job_stats) return 0;
    const { approved = 0, total = 0 } = collection.job_stats;
    return total > 0 ? (approved / collection.collection_number) * 100 : 0;
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Collections sx={{ mr: 2, color: 'primary.main' }} />
          Collections
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Collections sx={{ mr: 2, color: 'primary.main' }} />
        Collections
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your NFT collections. View details, monitor progress, and download completed packages.
      </Typography>

      {collections.length === 0 ? (
        <Alert severity="info">
          No collections found. Create your first collection using the Collection Form.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {collections.map((collection) => (
            <Grid item xs={12} md={6} lg={4} key={collection.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                      {collection.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenMenu(e, collection)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {collection.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={collection.status?.toUpperCase() || 'DRAFT'}
                      color={getStatusColor(collection.status)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${collection.collection_number} NFTs`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  
                  {collection.job_stats && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Progress: {collection.job_stats.approved || 0} / {collection.collection_number} approved
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={calculateProgress(collection)}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(collection.created_at)}
                  </Typography>
                  
                  {collection.updated_at !== collection.created_at && (
                    <Typography variant="body2" color="text.secondary">
                      Updated: {formatDate(collection.updated_at)}
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => handleViewDetails(collection)}
                    startIcon={<Info />}
                  >
                    Details
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleSelectCollection(collection)}
                    startIcon={<Work />}
                  >
                    Manage Jobs
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleViewDetails(menuCollection)}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleSelectCollection(menuCollection)}>
          <Work sx={{ mr: 1 }} />
          Manage Jobs
        </MenuItem>
        <MenuItem onClick={() => handleDownloadPackage(menuCollection?.id)}>
          <Download sx={{ mr: 1 }} />
          Download Package
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteCollection(menuCollection?.id)}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete Collection
        </MenuItem>
      </Menu>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedCollection && (
          <>
            <DialogTitle>
              {selectedCollection.name}
            </DialogTitle>
            <DialogContent>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Description"
                    secondary={selectedCollection.description}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Symbol"
                    secondary={selectedCollection.symbol}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Collection Size"
                    secondary={`${selectedCollection.collection_number} NFTs`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Art Style"
                    secondary={selectedCollection.style}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Batch Size"
                    secondary={selectedCollection.batch_size}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="External URL"
                    secondary={selectedCollection.external_url}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Royalty"
                    secondary={`${(selectedCollection.seller_fee_basis_points / 100).toFixed(1)}%`}
                  />
                </ListItem>
                {selectedCollection.creators && selectedCollection.creators.length > 0 && (
                  <ListItem>
                    <ListItemText
                      primary="Creator Address"
                      secondary={selectedCollection.creators[0].address || 'Not specified'}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText
                    primary="Art Prompt"
                    secondary={selectedCollection.art_prompt}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={formatDate(selectedCollection.created_at)}
                  />
                </ListItem>
                {selectedCollection.updated_at !== selectedCollection.created_at && (
                  <ListItem>
                    <ListItemText
                      primary="Last Updated"
                      secondary={formatDate(selectedCollection.updated_at)}
                    />
                  </ListItem>
                )}
              </List>
              
              {selectedCollection.job_stats && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Job Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {selectedCollection.job_stats.total || 0}
                        </Typography>
                        <Typography variant="body2">Total</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {selectedCollection.job_stats.processing || 0}
                        </Typography>
                        <Typography variant="body2">Processing</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {selectedCollection.job_stats.completed || 0}
                        </Typography>
                        <Typography variant="body2">Completed</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {selectedCollection.job_stats.approved || 0}
                        </Typography>
                        <Typography variant="body2">Approved</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
              <Button
                onClick={() => {
                  handleSelectCollection(selectedCollection);
                  setDetailsOpen(false);
                }}
                variant="contained"
                startIcon={<Work />}
              >
                Manage Jobs
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CollectionList;