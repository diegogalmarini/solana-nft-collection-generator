import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Search,
  Download,
  Upload,
  Star,
  StarBorder,
  ContentCopy
} from '@mui/icons-material';
import PromptTemplates from '../utils/PromptTemplates';

const PromptTemplateManager = ({ open, onClose, onTemplateSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    prompt: '',
    artStyle: '',
    negativePrompt: '',
    stylePreset: '',
    category: 'Custom',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = () => {
    const loadedTemplates = PromptTemplates.getTemplates();
    setTemplates(loadedTemplates);
    
    const cats = ['All', ...PromptTemplates.getCategories()];
    setCategories(cats);
  };

  const filterTemplates = () => {
    let filtered = templates;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = PromptTemplates.searchTemplates(searchQuery)
        .filter(t => selectedCategory === 'All' || t.category === selectedCategory);
    }
    
    setFilteredTemplates(filtered);
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name || !newTemplate.prompt) {
      alert('Name and prompt are required');
      return;
    }
    
    const success = PromptTemplates.saveTemplate(newTemplate);
    if (success) {
      loadTemplates();
      setNewTemplate({
        name: '',
        prompt: '',
        artStyle: '',
        negativePrompt: '',
        stylePreset: '',
        category: 'Custom',
        tags: []
      });
      setTagInput('');
    }
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate.name || !editingTemplate.prompt) {
      alert('Name and prompt are required');
      return;
    }
    
    const success = PromptTemplates.updateTemplate(editingTemplate.id, editingTemplate);
    if (success) {
      loadTemplates();
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const success = PromptTemplates.deleteTemplate(templateId);
      if (success) {
        loadTemplates();
      }
    }
  };

  const handleUseTemplate = (template) => {
    PromptTemplates.incrementUsage(template.id);
    onTemplateSelect(template);
    onClose();
  };

  const handleAddTag = (templateSetter, currentTemplate) => {
    if (tagInput.trim() && !currentTemplate.tags.includes(tagInput.trim())) {
      templateSetter({
        ...currentTemplate,
        tags: [...currentTemplate.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (templateSetter, currentTemplate, tagToRemove) => {
    templateSetter({
      ...currentTemplate,
      tags: currentTemplate.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleExportTemplates = () => {
    const jsonString = PromptTemplates.exportTemplates();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prompt-templates.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleImportTemplates = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = PromptTemplates.importTemplates(e.target.result, true);
        if (success) {
          loadTemplates();
          alert('Templates imported successfully!');
        } else {
          alert('Error importing templates. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );

  const TemplateCard = ({ template, isEditing = false }) => {
    const currentTemplate = isEditing ? editingTemplate : template;
    const templateSetter = isEditing ? setEditingTemplate : null;

    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          {isEditing ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={currentTemplate.name}
                  onChange={(e) => templateSetter({ ...currentTemplate, name: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={currentTemplate.category}
                    onChange={(e) => templateSetter({ ...currentTemplate, category: e.target.value })}
                  >
                    <MenuItem value="Custom">Custom</MenuItem>
                    <MenuItem value="Characters">Characters</MenuItem>
                    <MenuItem value="Landscapes">Landscapes</MenuItem>
                    <MenuItem value="Abstract">Abstract</MenuItem>
                    <MenuItem value="Pixel Art">Pixel Art</MenuItem>
                    <MenuItem value="Minimalist">Minimalist</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Prompt"
                  value={currentTemplate.prompt}
                  onChange={(e) => templateSetter({ ...currentTemplate, prompt: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Art Style"
                  value={currentTemplate.artStyle}
                  onChange={(e) => templateSetter({ ...currentTemplate, artStyle: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Style Preset"
                  value={currentTemplate.stylePreset}
                  onChange={(e) => templateSetter({ ...currentTemplate, stylePreset: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Negative Prompt"
                  value={currentTemplate.negativePrompt}
                  onChange={(e) => templateSetter({ ...currentTemplate, negativePrompt: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    label="Add Tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag(templateSetter, currentTemplate);
                      }
                    }}
                  />
                  <Button
                    size="small"
                    onClick={() => handleAddTag(templateSetter, currentTemplate)}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {currentTemplate.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      onDelete={() => handleRemoveTag(templateSetter, currentTemplate, tag)}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" component="div">
                  {template.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {template.usageCount > 0 && (
                    <Chip
                      icon={<Star />}
                      label={template.usageCount}
                      size="small"
                      color="primary"
                      sx={{ mr: 1 }}
                    />
                  )}
                  <Chip label={template.category} size="small" variant="outlined" />
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {template.prompt}
              </Typography>
              
              {template.artStyle && (
                <Typography variant="caption" display="block">
                  <strong>Art Style:</strong> {template.artStyle}
                </Typography>
              )}
              
              {template.stylePreset && (
                <Typography variant="caption" display="block">
                  <strong>Style Preset:</strong> {template.stylePreset}
                </Typography>
              )}
              
              {template.negativePrompt && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  <strong>Negative Prompt:</strong> {template.negativePrompt}
                </Typography>
              )}
              
              {template.tags.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {template.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </>
          )}
        </CardContent>
        
        <CardActions>
          {isEditing ? (
            <>
              <Button size="small" startIcon={<Save />} onClick={handleUpdateTemplate}>
                Save
              </Button>
              <Button size="small" startIcon={<Cancel />} onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="small" onClick={() => handleUseTemplate(template)}>
                Use Template
              </Button>
              {!template.isDefault && (
                <>
                  <IconButton size="small" onClick={() => setEditingTemplate({ ...template })}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteTemplate(template.id)}>
                    <Delete />
                  </IconButton>
                </>
              )}
              <Tooltip title="Copy to clipboard">
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(template.prompt);
                    alert('Prompt copied to clipboard!');
                  }}
                >
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            </>
          )}
        </CardActions>
      </Card>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Prompt Template Manager</Typography>
          <Box>
            <Button
              size="small"
              startIcon={<Download />}
              onClick={handleExportTemplates}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            <Button
              size="small"
              startIcon={<Upload />}
              component="label"
            >
              Import
              <input
                type="file"
                hidden
                accept=".json"
                onChange={handleImportTemplates}
              />
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Browse Templates" />
          <Tab label="Create New" />
          <Tab label="Most Used" />
        </Tabs>
        
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Search templates"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {filteredTemplates.length === 0 ? (
            <Alert severity="info">No templates found matching your criteria.</Alert>
          ) : (
            filteredTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))
          )}
        </TabPanel>
        
        <TabPanel value={currentTab} index={1}>
          <TemplateCard template={newTemplate} isEditing={true} />
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveTemplate}
            disabled={!newTemplate.name || !newTemplate.prompt}
          >
            Save Template
          </Button>
        </TabPanel>
        
        <TabPanel value={currentTab} index={2}>
          {PromptTemplates.getMostUsedTemplates().map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </TabPanel>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptTemplateManager;