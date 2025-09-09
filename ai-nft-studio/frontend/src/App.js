import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import { AutoAwesome, Collections, Work, Settings } from '@mui/icons-material';

// Components
import AIIdeation from './components/AIIdeation';
import CollectionForm from './components/CollectionForm';
import JobManager from './components/JobManager';
import CollectionList from './components/CollectionList';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9c27b0', // Purple for Mintonaire branding
    },
    secondary: {
      main: '#00bcd4', // Cyan accent
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [generatedMetadata, setGeneratedMetadata] = useState(null);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleMetadataGenerated = (metadata) => {
    setGeneratedMetadata(metadata);
    setCurrentTab(1); // Switch to Collection Form tab
    showNotification('Metadata generated successfully! Check the Collection Form.', 'success');
  };

  const handleCollectionCreated = (collection) => {
    setSelectedCollection(collection);
    setCurrentTab(2); // Switch to Job Manager tab
    showNotification(`Collection "${collection.name}" created successfully!`, 'success');
  };

  const handleCollectionSelected = (collection) => {
    setSelectedCollection(collection);
    setCurrentTab(2); // Switch to Job Manager tab
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <AutoAwesome sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              AI-Powered Solana NFT Studio
            </Typography>
            <Typography variant="body2" color="inherit" sx={{ opacity: 0.7 }}>
              for Mintonaire.io
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Navigation Tabs */}
        <Paper square elevation={1}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              icon={<AutoAwesome />}
              label="AI Ideation"
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <Tab
              icon={<Settings />}
              label="Collection Form"
              id="tab-1"
              aria-controls="tabpanel-1"
            />
            <Tab
              icon={<Work />}
              label="Job Manager"
              id="tab-2"
              aria-controls="tabpanel-2"
            />
            <Tab
              icon={<Collections />}
              label="Collections"
              id="tab-3"
              aria-controls="tabpanel-3"
            />
          </Tabs>
        </Paper>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
          {/* AI Ideation Tab */}
          <TabPanel value={currentTab} index={0}>
            <AIIdeation
              onMetadataGenerated={handleMetadataGenerated}
              showNotification={showNotification}
            />
          </TabPanel>

          {/* Collection Form Tab */}
          <TabPanel value={currentTab} index={1}>
            <CollectionForm
              generatedMetadata={generatedMetadata}
              onCollectionCreated={handleCollectionCreated}
              showNotification={showNotification}
            />
          </TabPanel>

          {/* Job Manager Tab */}
          <TabPanel value={currentTab} index={2}>
            <JobManager
              selectedCollection={selectedCollection}
              showNotification={showNotification}
            />
          </TabPanel>

          {/* Collections List Tab */}
          <TabPanel value={currentTab} index={3}>
            <CollectionList
              onCollectionSelected={handleCollectionSelected}
              showNotification={showNotification}
            />
          </TabPanel>
        </Container>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={closeNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={closeNotification}
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;