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
  Alert,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse
} from '@mui/material';
import {
  AutoAwesome,
  Lightbulb,
  Palette,
  Send,
  Refresh,
  Settings,
  ExpandMore,
  ExpandLess,
  BookmarkBorder
} from '@mui/icons-material';
import axios from 'axios';
import PromptTemplateManager from './PromptTemplateManager';

const AIIdeation = ({ onMetadataGenerated, showNotification }) => {
  const [keywords, setKeywords] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [promptHistory, setPromptHistory] = useState([]);
  
  // Advanced AI Parameters
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [stylePreset, setStylePreset] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState('');
  
  // Template System
  const [savedTemplates, setSavedTemplates] = useState(() => {
    const saved = localStorage.getItem('promptTemplates');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);

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
      const requestData = {
        keywords: keywords.trim()
      };
      
      // Add advanced parameters if provided
      if (stylePreset) requestData.stylePreset = stylePreset;
      if (negativePrompt.trim()) requestData.negativePrompt = negativePrompt.trim();
      if (seed) requestData.seed = parseInt(seed);
      
      const response = await axios.post('/api/ai/generate-prompt', requestData);

      const newPrompt = response.data.prompt;
      setGeneratedPrompt(newPrompt);
      
      // Add to history with advanced parameters
      setPromptHistory(prev => [
        { 
          keywords: keywords.trim(), 
          prompt: newPrompt, 
          timestamp: new Date(),
          stylePreset,
          negativePrompt,
          seed
        },
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
    // Load advanced parameters from history
    if (historyItem.stylePreset) setStylePreset(historyItem.stylePreset);
    if (historyItem.negativePrompt) setNegativePrompt(historyItem.negativePrompt);
    if (historyItem.seed) setSeed(historyItem.seed.toString());
  };

  const handleSaveTemplate = () => {
    if (!generatedPrompt.trim()) {
      showNotification('Please generate a prompt first', 'warning');
      return;
    }
    
    const templateName = prompt('Enter a name for this template:');
    if (!templateName) return;
    
    const newTemplate = {
      id: Date.now(),
      name: templateName,
      keywords,
      prompt: generatedPrompt,
      stylePreset,
      negativePrompt,
      seed
    };
    
    const updatedTemplates = [...savedTemplates, newTemplate];
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('promptTemplates', JSON.stringify(updatedTemplates));
    showNotification('Template saved successfully!', 'success');
  };

  const handleLoadTemplate = (templateId) => {
    const template = savedTemplates.find(t => t.id === templateId);
    if (template) {
      setKeywords(template.keywords);
      setGeneratedPrompt(template.prompt);
      setStylePreset(template.stylePreset || '');
      setNegativePrompt(template.negativePrompt || '');
      setSeed(template.seed || '');
      setSelectedTemplate('');
      showNotification('Template loaded successfully!', 'success');
    }
  };

  const handleTemplateSelect = (template) => {
    setKeywords(template.prompt || '');
    setGeneratedPrompt(template.prompt || '');
    setStylePreset(template.stylePreset || '');
    setNegativePrompt(template.negativePrompt || '');
    setSeed(template.seed ? template.seed.toString() : '');
    showNotification('Template applied successfully!', 'success');
  };

  const stylePresetOptions = [
    { value: '', label: 'Default' },
    { value: 'photographic', label: 'Photographic' },
    { value: 'digital-art', label: 'Digital Art' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'fantasy-art', label: 'Fantasy Art' },
    { value: 'anime', label: 'Anime' },
    { value: 'comic-book', label: 'Comic Book' },
    { value: '3d-model', label: '3D Model' },
    { value: 'pixel-art', label: 'Pixel Art' }
  ];

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <AutoAwesome sx={{ mr: 1 }} />
                Step 1: Enter Keywords
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<BookmarkBorder />}
                onClick={() => setTemplateManagerOpen(true)}
              >
                Templates
              </Button>
            </Box>
            
            {/* Template Loader */}
            {savedTemplates.length > 0 && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Load from Template</InputLabel>
                <Select
                  value={selectedTemplate}
                  label="Load from Template"
                  onChange={(e) => handleLoadTemplate(e.target.value)}
                >
                  {savedTemplates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

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

            {/* Advanced Settings Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={showAdvancedSettings}
                  onChange={(e) => setShowAdvancedSettings(e.target.checked)}
                  icon={<Settings />}
                  checkedIcon={<Settings />}
                />
              }
              label="Advanced AI Settings"
              sx={{ mb: 2 }}
            />

            {/* Advanced Settings Panel */}
            <Collapse in={showAdvancedSettings}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Settings sx={{ mr: 1, fontSize: 18 }} />
                  Advanced Parameters
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Style Preset</InputLabel>
                      <Select
                        value={stylePreset}
                        label="Style Preset"
                        onChange={(e) => setStylePreset(e.target.value)}
                      >
                        {stylePresetOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      label="Negative Prompt"
                      placeholder="e.g., text, signatures, watermarks, blurry"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      helperText="Specify what to avoid in generated images"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Seed (Optional)"
                      placeholder="e.g., 12345"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      helperText="Use a specific seed for reproducible results"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>

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
              <Button
                fullWidth
                variant="outlined"
                onClick={handleSaveTemplate}
                startIcon={<Refresh />}
                sx={{ mb: 2 }}
              >
                Save as Template
              </Button>
            )}

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
      
      {/* Prompt Template Manager */}
      <PromptTemplateManager
        open={templateManagerOpen}
        onClose={() => setTemplateManagerOpen(false)}
        onTemplateSelect={handleTemplateSelect}
      />
    </Box>
  );
};

export default AIIdeation;