/**
 * Prompt Templates Utility
 * 
 * This utility manages prompt templates using localStorage for persistence.
 * Users can save, load, and manage their favorite prompt templates.
 */

class PromptTemplates {
  static STORAGE_KEY = 'nft_prompt_templates';

  /**
   * Get all saved prompt templates
   * @returns {Array} Array of template objects
   */
  static getTemplates() {
    try {
      const templates = localStorage.getItem(this.STORAGE_KEY);
      return templates ? JSON.parse(templates) : this.getDefaultTemplates();
    } catch (error) {
      console.error('Error loading templates:', error);
      return this.getDefaultTemplates();
    }
  }

  /**
   * Save a new template
   * @param {Object} template - Template object with name, prompt, and metadata
   * @returns {boolean} Success status
   */
  static saveTemplate(template) {
    try {
      const templates = this.getTemplates();
      const newTemplate = {
        id: Date.now().toString(),
        name: template.name,
        prompt: template.prompt,
        artStyle: template.artStyle || '',
        negativePrompt: template.negativePrompt || '',
        stylePreset: template.stylePreset || '',
        category: template.category || 'Custom',
        tags: template.tags || [],
        createdAt: new Date().toISOString(),
        usageCount: 0
      };
      
      templates.push(newTemplate);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  }

  /**
   * Update an existing template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Updates to apply
   * @returns {boolean} Success status
   */
  static updateTemplate(templateId, updates) {
    try {
      const templates = this.getTemplates();
      const index = templates.findIndex(t => t.id === templateId);
      
      if (index === -1) return false;
      
      templates[index] = {
        ...templates[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      return false;
    }
  }

  /**
   * Delete a template
   * @param {string} templateId - Template ID
   * @returns {boolean} Success status
   */
  static deleteTemplate(templateId) {
    try {
      const templates = this.getTemplates();
      const filteredTemplates = templates.filter(t => t.id !== templateId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTemplates));
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  /**
   * Increment usage count for a template
   * @param {string} templateId - Template ID
   */
  static incrementUsage(templateId) {
    const templates = this.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      template.lastUsed = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    }
  }

  /**
   * Get templates by category
   * @param {string} category - Category name
   * @returns {Array} Filtered templates
   */
  static getTemplatesByCategory(category) {
    const templates = this.getTemplates();
    return templates.filter(t => t.category === category);
  }

  /**
   * Search templates by name or tags
   * @param {string} query - Search query
   * @returns {Array} Matching templates
   */
  static searchTemplates(query) {
    const templates = this.getTemplates();
    const lowercaseQuery = query.toLowerCase();
    
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.prompt.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get most used templates
   * @param {number} limit - Number of templates to return
   * @returns {Array} Most used templates
   */
  static getMostUsedTemplates(limit = 5) {
    const templates = this.getTemplates();
    return templates
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  /**
   * Export templates as JSON
   * @returns {string} JSON string of all templates
   */
  static exportTemplates() {
    const templates = this.getTemplates();
    return JSON.stringify(templates, null, 2);
  }

  /**
   * Import templates from JSON
   * @param {string} jsonString - JSON string of templates
   * @param {boolean} merge - Whether to merge with existing templates
   * @returns {boolean} Success status
   */
  static importTemplates(jsonString, merge = true) {
    try {
      const importedTemplates = JSON.parse(jsonString);
      
      if (!Array.isArray(importedTemplates)) {
        throw new Error('Invalid template format');
      }
      
      let templates = merge ? this.getTemplates() : [];
      
      // Add imported templates with new IDs to avoid conflicts
      importedTemplates.forEach(template => {
        const newTemplate = {
          ...template,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          importedAt: new Date().toISOString()
        };
        templates.push(newTemplate);
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
      return true;
    } catch (error) {
      console.error('Error importing templates:', error);
      return false;
    }
  }

  /**
   * Get default templates
   * @returns {Array} Default template objects
   */
  static getDefaultTemplates() {
    return [
      {
        id: 'default-1',
        name: 'Cyberpunk Character',
        prompt: 'A futuristic cyberpunk character with neon lights, digital implants, and urban background',
        artStyle: 'cyberpunk',
        negativePrompt: 'blurry, low quality, distorted',
        stylePreset: 'neon-punk',
        category: 'Characters',
        tags: ['cyberpunk', 'futuristic', 'neon', 'character'],
        createdAt: new Date().toISOString(),
        usageCount: 0,
        isDefault: true
      },
      {
        id: 'default-2',
        name: 'Fantasy Landscape',
        prompt: 'A magical fantasy landscape with floating islands, mystical creatures, and ethereal lighting',
        artStyle: 'fantasy',
        negativePrompt: 'modern, realistic, urban',
        stylePreset: 'fantasy-art',
        category: 'Landscapes',
        tags: ['fantasy', 'magical', 'landscape', 'mystical'],
        createdAt: new Date().toISOString(),
        usageCount: 0,
        isDefault: true
      },
      {
        id: 'default-3',
        name: 'Abstract Art',
        prompt: 'Colorful abstract composition with geometric shapes, flowing lines, and vibrant colors',
        artStyle: 'abstract',
        negativePrompt: 'realistic, photographic, detailed',
        stylePreset: 'abstract',
        category: 'Abstract',
        tags: ['abstract', 'geometric', 'colorful', 'modern'],
        createdAt: new Date().toISOString(),
        usageCount: 0,
        isDefault: true
      },
      {
        id: 'default-4',
        name: 'Pixel Art Character',
        prompt: '8-bit pixel art character, retro gaming style, colorful and detailed sprite',
        artStyle: 'pixel art',
        negativePrompt: 'high resolution, realistic, 3d',
        stylePreset: 'pixel-art',
        category: 'Pixel Art',
        tags: ['pixel', 'retro', 'gaming', '8-bit'],
        createdAt: new Date().toISOString(),
        usageCount: 0,
        isDefault: true
      },
      {
        id: 'default-5',
        name: 'Minimalist Design',
        prompt: 'Clean minimalist design with simple shapes, limited color palette, and elegant composition',
        artStyle: 'minimalist',
        negativePrompt: 'cluttered, complex, detailed, busy',
        stylePreset: 'minimalist',
        category: 'Minimalist',
        tags: ['minimalist', 'clean', 'simple', 'elegant'],
        createdAt: new Date().toISOString(),
        usageCount: 0,
        isDefault: true
      }
    ];
  }

  /**
   * Get all available categories
   * @returns {Array} Array of category names
   */
  static getCategories() {
    const templates = this.getTemplates();
    const categories = [...new Set(templates.map(t => t.category))];
    return categories.sort();
  }

  /**
   * Reset to default templates
   * @returns {boolean} Success status
   */
  static resetToDefaults() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error resetting templates:', error);
      return false;
    }
  }
}

export default PromptTemplates;