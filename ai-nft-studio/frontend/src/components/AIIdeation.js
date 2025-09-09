import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AutoAwesome,
  Lightbulb,
  Palette,
  Send,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';

const AIIdeation = ({ onMetadataGenerated, showNotification }) => {
  const [keywords, setKeywords] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [promptHistory, setPromptHistory] = useState([]);

  const exampleKeywords = [
    'cyberpunk robots',
    'mystical forest creatures',
    'space pirates',
    'neon samurai',
    'crystal dragons',
    'steampunk inventors',
    'cosmic wizards',
    'digital ghosts'
  ];

  const handleGeneratePrompt = async () => {
    if (!keywords.trim()) {
      showNotification('Please enter some keywords first', 'warning');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const response = await axios.post('/api/ai/generate-prompt', {
        keywords: keywords.trim()
      });

      const newPrompt = response.data.prompt;
      setGeneratedPrompt(newPrompt);
      
      // Add to history
      setPromptHistory(prev => [
        { keywords: keywords.trim(), prompt: newPrompt, timestamp: new Date() },
        ...prev.slice(0, 4) // Keep only last 5
      ]);

      showNotification('AI prompt generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating prompt:', error);
      showNotification(
        error.response?.data?.error || 'Failed to generate prompt. Please try again.',
        'error'
      );
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateMetadata = async () => {
    if (!generatedPrompt.trim()) {
      showNotification('Please generate an AI prompt first', 'warning');
      return;
    }

    setIsGeneratingMetadata(true);
    try {
      const response = await axios.post('/api/ai/generate-metadata', {
        prompt: generatedPrompt.trim()
      });

      const metadata = response.data.metadata;
      onMetadataGenerated(metadata);
      showNotification('Collection metadata generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating metadata:', error);
      showNotification(
        error.response?.data?.error || 'Failed to generate metadata. Please try again.',
        'error'
      );
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const handleKeywordClick = (keyword) => {
    setKeywords(keyword);
  };

  const handlePromptHistoryClick = (historyItem) => {
    setKeywords(historyItem.keywords);
    setGeneratedPrompt(historyItem.prompt);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Lightbulb sx={{ mr: 2, color: 'primary.main' }} />
        AI Creative Partner
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Let AI help you brainstorm unique NFT collection ideas. Start with keywords and let our AI generate detailed art prompts and collection metadata.
      </Typography>

      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AutoAwesome sx={{ mr: 1 }} />
              Step 1: Enter Keywords
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Keywords or concept"
              placeholder="e.g., cyberpunk robots, neon colors, futuristic city"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Try these examples:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {exampleKeywords.map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    onClick={() => handleKeywordClick(keyword)}
                    size="small"
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleGeneratePrompt}
              disabled={isGeneratingPrompt || !keywords.trim()}
              startIcon={isGeneratingPrompt ? <CircularProgress size={20} /> : <Send />}
              sx={{ mb: 2 }}
            >
              {isGeneratingPrompt ? 'Generating...' : 'Generate AI Prompt'}
            </Button>

            {generatedPrompt && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Palette sx={{ mr: 1 }} />
                  Step 2: Generate Metadata
                </Typography>
                
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  onClick={handleGenerateMetadata}
                  disabled={isGeneratingMetadata}
                  startIcon={isGeneratingMetadata ? <CircularProgress size={20} /> : <AutoAwesome />}
                >
                  {isGeneratingMetadata ? 'Generating...' : 'Generate Collection Metadata'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* Output Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generated AI Prompt
            </Typography>
            
            {generatedPrompt ? (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {generatedPrompt}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                Your generated AI prompt will appear here. Enter keywords and click "Generate AI Prompt" to start.
              </Alert>
            )}

            {/* Prompt History */}
            {promptHistory.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Recent Prompts
                </Typography>
                {promptHistory.map((item, index) => (
                  <Card 
                    key={index} 
                    variant="outlined" 
                    sx={{ 
                      mb: 1, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handlePromptHistoryClick(item)}
                  >
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                        {item.keywords}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {item.prompt}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIIdeation;