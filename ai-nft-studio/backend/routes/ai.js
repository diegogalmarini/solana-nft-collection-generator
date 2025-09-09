const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

/**
 * POST /api/ai/generate-prompt
 * Generate AI art prompt from keywords
 */
router.post('/generate-prompt', async (req, res) => {
  try {
    const { keywords, style, mood, additional_context } = req.body;
    
    if (!keywords || keywords.trim().length === 0) {
      return res.status(400).json({
        error: 'Keywords are required',
        example: { keywords: 'cyberpunk city, neon lights, futuristic' }
      });
    }

    console.log(`🎨 Generating art prompt for keywords: ${keywords}`);
    
    const prompt = await aiService.generateArtPrompt(keywords, {
      style,
      mood,
      additional_context
    });
    
    res.json({
      success: true,
      prompt,
      input: {
        keywords,
        style,
        mood,
        additional_context
      }
    });
  } catch (error) {
    console.error('❌ Error generating art prompt:', error);
    res.status(500).json({
      error: 'Failed to generate art prompt',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/generate-metadata
 * Generate collection metadata from art prompt
 */
router.post('/generate-metadata', async (req, res) => {
  try {
    const { art_prompt, collection_theme, target_audience } = req.body;
    
    if (!art_prompt || art_prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Art prompt is required',
        example: { art_prompt: 'A cyberpunk cityscape with neon lights and flying cars' }
      });
    }

    console.log(`📝 Generating collection metadata for prompt: ${art_prompt.substring(0, 50)}...`);
    
    const metadata = await aiService.generateCollectionMetadata(art_prompt, {
      collection_theme,
      target_audience
    });
    
    res.json({
      success: true,
      metadata,
      input: {
        art_prompt,
        collection_theme,
        target_audience
      }
    });
  } catch (error) {
    console.error('❌ Error generating collection metadata:', error);
    res.status(500).json({
      error: 'Failed to generate collection metadata',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/generate-image
 * Generate a single image (for testing)
 */
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, style_preset, seed } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt is required',
        example: { prompt: 'A beautiful landscape with mountains and lakes' }
      });
    }

    console.log(`🖼️ Generating test image for prompt: ${prompt.substring(0, 50)}...`);
    
    const imageData = await aiService.generateImage(prompt, {
      style_preset,
      seed
    });
    
    res.json({
      success: true,
      image: {
        data: imageData.toString('base64'),
        format: 'png',
        size: '1200x1200'
      },
      input: {
        prompt,
        style_preset,
        seed
      }
    });
  } catch (error) {
    console.error('❌ Error generating image:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/test-connection
 * Test AI service connections
 */
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🔍 Testing AI service connections...');
    
    const results = await aiService.testConnection();
    
    res.json({
      success: true,
      connections: results
    });
  } catch (error) {
    console.error('❌ Error testing AI connections:', error);
    res.status(500).json({
      error: 'Failed to test AI connections',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/validate-keys
 * Validate API keys
 */
router.get('/validate-keys', async (req, res) => {
  try {
    console.log('🔑 Validating API keys...');
    
    const validation = await aiService.validateApiKeys();
    
    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('❌ Error validating API keys:', error);
    res.status(500).json({
      error: 'Failed to validate API keys',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/enhance-prompt
 * Enhance an existing prompt with AI suggestions
 */
router.post('/enhance-prompt', async (req, res) => {
  try {
    const { original_prompt, enhancement_type = 'general' } = req.body;
    
    if (!original_prompt || original_prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Original prompt is required',
        example: { original_prompt: 'A cat sitting on a chair' }
      });
    }

    console.log(`✨ Enhancing prompt: ${original_prompt.substring(0, 50)}...`);
    
    // Create enhancement context based on type
    let enhancementContext = '';
    switch (enhancement_type) {
      case 'artistic':
        enhancementContext = 'Focus on artistic style, composition, and visual appeal';
        break;
      case 'detailed':
        enhancementContext = 'Add more specific details and descriptive elements';
        break;
      case 'professional':
        enhancementContext = 'Make it suitable for professional NFT collection';
        break;
      default:
        enhancementContext = 'Improve overall quality and appeal';
    }
    
    const enhancedPrompt = await aiService.generateArtPrompt(
      original_prompt,
      { additional_context: `Enhancement request: ${enhancementContext}` }
    );
    
    res.json({
      success: true,
      original_prompt,
      enhanced_prompt: enhancedPrompt,
      enhancement_type
    });
  } catch (error) {
    console.error('❌ Error enhancing prompt:', error);
    res.status(500).json({
      error: 'Failed to enhance prompt',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/suggest-variations
 * Suggest prompt variations for diversity
 */
router.post('/suggest-variations', async (req, res) => {
  try {
    const { base_prompt, variation_count = 3 } = req.body;
    
    if (!base_prompt || base_prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Base prompt is required',
        example: { base_prompt: 'A mystical forest scene' }
      });
    }

    if (variation_count < 1 || variation_count > 10) {
      return res.status(400).json({
        error: 'Variation count must be between 1 and 10'
      });
    }

    console.log(`🔄 Generating ${variation_count} variations for: ${base_prompt.substring(0, 50)}...`);
    
    const variations = [];
    const variationTypes = [
      'different lighting conditions',
      'alternative color schemes',
      'varied compositions',
      'different artistic styles',
      'seasonal variations',
      'time of day changes',
      'weather variations',
      'perspective changes'
    ];
    
    for (let i = 0; i < variation_count; i++) {
      const variationType = variationTypes[i % variationTypes.length];
      const variation = await aiService.generateArtPrompt(
        base_prompt,
        { additional_context: `Create a variation with ${variationType}` }
      );
      
      variations.push({
        variation_number: i + 1,
        variation_type: variationType,
        prompt: variation
      });
    }
    
    res.json({
      success: true,
      base_prompt,
      variations
    });
  } catch (error) {
    console.error('❌ Error generating variations:', error);
    res.status(500).json({
      error: 'Failed to generate variations',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/style-presets
 * Get available style presets for image generation
 */
router.get('/style-presets', (req, res) => {
  try {
    const stylePresets = [
      { id: 'enhance', name: 'Enhance', description: 'Enhance the original image' },
      { id: 'anime', name: 'Anime', description: 'Anime/manga style' },
      { id: 'photographic', name: 'Photographic', description: 'Realistic photographic style' },
      { id: 'digital-art', name: 'Digital Art', description: 'Digital artwork style' },
      { id: 'comic-book', name: 'Comic Book', description: 'Comic book illustration style' },
      { id: 'fantasy-art', name: 'Fantasy Art', description: 'Fantasy artwork style' },
      { id: 'line-art', name: 'Line Art', description: 'Clean line art style' },
      { id: 'analog-film', name: 'Analog Film', description: 'Vintage film photography style' },
      { id: 'neon-punk', name: 'Neon Punk', description: 'Cyberpunk with neon aesthetics' },
      { id: 'isometric', name: 'Isometric', description: 'Isometric 3D style' },
      { id: 'low-poly', name: 'Low Poly', description: 'Low polygon 3D style' },
      { id: 'origami', name: 'Origami', description: 'Paper folding art style' },
      { id: 'modeling-compound', name: 'Modeling Compound', description: 'Clay/plasticine style' },
      { id: 'cinematic', name: 'Cinematic', description: 'Movie-like cinematography' },
      { id: '3d-model', name: '3D Model', description: '3D rendered style' }
    ];
    
    res.json({
      success: true,
      style_presets: stylePresets
    });
  } catch (error) {
    console.error('❌ Error fetching style presets:', error);
    res.status(500).json({
      error: 'Failed to fetch style presets',
      details: error.message
    });
  }
});

module.exports = router;