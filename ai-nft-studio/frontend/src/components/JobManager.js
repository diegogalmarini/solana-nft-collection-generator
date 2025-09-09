import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Work,
  PlayArrow,
  Pause,
  CheckCircle,
  Cancel,
  Refresh,
  Download,
  Visibility,
  Delete,
  Stop,
  GetApp
} from '@mui/icons-material';
import axios from 'axios';

const JobManager = ({ selectedCollection, showNotification }) => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    approved: 0,
    failed: 0
  });
  const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);
  const [packageUrl, setPackageUrl] = useState(null);

  // Auto-refresh jobs every 5 seconds when processing
  useEffect(() => {
    let interval;
    if (selectedCollection && isProcessing) {
      interval = setInterval(() => {
        fetchJobs();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedCollection, isProcessing]);

  // Fetch jobs when collection changes
  useEffect(() => {
    if (selectedCollection) {
      fetchJobs();
    }
  }, [selectedCollection]);

  const fetchJobs = async () => {
    if (!selectedCollection) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/collections/${selectedCollection.id}/jobs`);
      setJobs(response.data.jobs);
      
      // Calculate stats
      const newStats = response.data.jobs.reduce((acc, job) => {
        acc.total++;
        acc[job.status]++;
        return acc;
      }, {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        approved: 0,
        failed: 0
      });
      setStats(newStats);
      
      // Check if any jobs are processing
      const hasProcessing = response.data.jobs.some(job => job.status === 'processing');
      setIsProcessing(hasProcessing);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showNotification('Failed to fetch jobs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBatch = async () => {
    if (!selectedCollection) return;
    
    setIsProcessing(true);
    try {
      await axios.post(`/api/collections/${selectedCollection.id}/generate-initial`);
      showNotification('Batch generation started!', 'success');
      fetchJobs();
    } catch (error) {
      console.error('Error starting batch:', error);
      showNotification(
        error.response?.data?.error || 'Failed to start batch generation',
        'error'
      );
      setIsProcessing(false);
    }
  };

  const handleContinueBatch = async () => {
    if (!selectedCollection) return;
    
    setIsProcessing(true);
    try {
      await axios.post(`/api/collections/${selectedCollection.id}/generate-continued`);
      showNotification('Continued batch generation!', 'success');
      fetchJobs();
    } catch (error) {
      console.error('Error continuing batch:', error);
      showNotification(
        error.response?.data?.error || 'Failed to continue batch generation',
        'error'
      );
      setIsProcessing(false);
    }
  };

  const handleApproveJob = async (jobId) => {
    try {
      await axios.put(`/api/jobs/${jobId}/approve`);
      showNotification('Image approved!', 'success');
      fetchJobs();
    } catch (error) {
      console.error('Error approving job:', error);
      showNotification('Failed to approve image', 'error');
    }
  };

  const handleRegenerateJob = async (jobId) => {
    try {
      await axios.put(`/api/jobs/${jobId}/regenerate`);
      showNotification('Regenerating image...', 'info');
      fetchJobs();
    } catch (error) {
      console.error('Error regenerating job:', error);
      showNotification('Failed to regenerate image', 'error');
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await axios.delete(`/api/jobs/${jobId}`);
      showNotification('Job deleted', 'info');
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      showNotification('Failed to delete job', 'error');
    }
  };

  const handleGeneratePackage = async () => {
    if (!selectedCollection) return;
    
    setIsGeneratingPackage(true);
    try {
      const response = await axios.post(`/api/collections/${selectedCollection.id}/create-package`);
      setPackageUrl(response.data.downloadUrl);
      showNotification('Package generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating package:', error);
      showNotification(
        error.response?.data?.error || 'Failed to generate package',
        'error'
      );
    } finally {
      setIsGeneratingPackage(false);
    }
  };

  const handleDownloadPackage = () => {
    if (packageUrl) {
      window.open(packageUrl, '_blank');
    }
  };

  const handlePreviewJob = (job) => {
    setSelectedJob(job);
    setPreviewOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'approved': return 'primary';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'approved': return <CheckCircle />;
      case 'processing': return <CircularProgress size={16} />;
      case 'failed': return <Cancel />;
      default: return null;
    }
  };

  if (!selectedCollection) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Work sx={{ mr: 2, color: 'primary.main' }} />
          Job Manager
        </Typography>
        <Alert severity="info">
          Please create or select a collection first to manage jobs.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Work sx={{ mr: 2, color: 'primary.main' }} />
        Job Manager
      </Typography>
      
      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
        Collection: {selectedCollection.name}
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">{stats.total}</Typography>
              <Typography variant="body2">Total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="text.secondary">{stats.pending}</Typography>
              <Typography variant="body2">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">{stats.processing}</Typography>
              <Typography variant="body2">Processing</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">{stats.completed}</Typography>
              <Typography variant="body2">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main">{stats.approved}</Typography>
              <Typography variant="body2">Approved</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main">{stats.failed}</Typography>
              <Typography variant="body2">Failed</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Progress: {stats.approved} / {selectedCollection.collection_number} approved
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(stats.approved / selectedCollection.collection_number) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {/* Control Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={handleStartBatch}
          disabled={isProcessing || stats.total > 0}
          startIcon={<PlayArrow />}
        >
          Start Generation
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleContinueBatch}
          disabled={isProcessing || stats.total === 0}
          startIcon={<PlayArrow />}
        >
          Continue Batch
        </Button>
        
        <Button
          variant="outlined"
          onClick={fetchJobs}
          disabled={isLoading}
          startIcon={<Refresh />}
        >
          Refresh
        </Button>
        
        <Button
          variant="contained"
          color="secondary"
          onClick={handleGeneratePackage}
          disabled={isGeneratingPackage || stats.approved === 0}
          startIcon={isGeneratingPackage ? <CircularProgress size={20} /> : <GetApp />}
        >
          {isGeneratingPackage ? 'Generating...' : 'Create Package'}
        </Button>
        
        {packageUrl && (
          <Button
            variant="contained"
            color="success"
            onClick={handleDownloadPackage}
            startIcon={<Download />}
          >
            Download Package
          </Button>
        )}
      </Box>

      {/* Jobs Grid */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : jobs.length === 0 ? (
        <Alert severity="info">
          No jobs found. Click "Start Generation" to begin creating NFT images.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {jobs.map((job) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={job.id}>
              <Card>
                {job.image_url && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={job.image_url}
                    alt={`NFT #${job.token_id}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handlePreviewJob(job)}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    #{job.token_id}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(job.status)}
                    label={job.status.toUpperCase()}
                    color={getStatusColor(job.status)}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  {job.error_message && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      {job.error_message}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  {job.status === 'completed' && (
                    <>
                      <Button
                        size="small"
                        onClick={() => handleApproveJob(job.id)}
                        startIcon={<CheckCircle />}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleRegenerateJob(job.id)}
                        startIcon={<Refresh />}
                      >
                        Regenerate
                      </Button>
                    </>
                  )}
                  {job.image_url && (
                    <IconButton
                      size="small"
                      onClick={() => handlePreviewJob(job)}
                    >
                      <Visibility />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteJob(job.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>
              NFT #{selectedJob.token_id} - {selectedJob.status.toUpperCase()}
            </DialogTitle>
            <DialogContent>
              {selectedJob.image_url && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <img
                    src={selectedJob.image_url}
                    alt={`NFT #${selectedJob.token_id}`}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                  />
                </Box>
              )}
              <Typography variant="body2" color="text.secondary">
                <strong>Prompt:</strong> {selectedJob.prompt}
              </Typography>
              {selectedJob.metadata && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Metadata:</strong>
                  </Typography>
                  <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                    {JSON.stringify(selectedJob.metadata, null, 2)}
                  </pre>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              {selectedJob.status === 'completed' && (
                <>
                  <Button
                    onClick={() => {
                      handleApproveJob(selectedJob.id);
                      setPreviewOpen(false);
                    }}
                    startIcon={<CheckCircle />}
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      handleRegenerateJob(selectedJob.id);
                      setPreviewOpen(false);
                    }}
                    startIcon={<Refresh />}
                  >
                    Regenerate
                  </Button>
                </>
              )}
              <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default JobManager;