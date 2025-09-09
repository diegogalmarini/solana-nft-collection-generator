const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AIService {
  constructor() {
    this.stabilityApiKey = process.env.STABILITY_AI_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.imageWidth = parseInt(process.env.IMAGE_WIDTH) || 1200;
    this.imageHeight = parseInt(process.env.IMAGE_HEIGHT) || 1200;
    this.uploadsDir = process.env.UPLOADS_DIR || './uploads';
    
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generate AI art prompt using Gemini LLM
   * @param {string} keywords - User input keywords
   * @returns {Promise<string>} Generated art prompt
   */
  async generateArtPrompt(keywords) {
    try {
      const metaPrompt = `
        You are an expert AI art prompt engineer for NFT collections. 
        Based on the following keywords: "${keywords}", 
        create a detailed, creative art prompt that would generate high-quality, 
        unique digital artwork suitable for an NFT collection.
        
        The prompt should be:
        - Descriptive and vivid
        - Include artistic style references
        - Specify colors, mood, and composition
        - Be suitable for 1200x1200px square format
        - Avoid copyrighted characters or brands
        
        Return only the art prompt, no additional text.
      `;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{ text: metaPrompt }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedPrompt = response.data.candidates[0].content.parts[0].text.trim();
      console.log('🎨 Generated art prompt:', generatedPrompt);
      return generatedPrompt;
    } catch (error) {
      console.error('❌ Error generating art prompt:', error.response?.data || error.message);
      throw new Error('Failed to generate art prompt');
    }
  }

  /**
   * Generate collection metadata using Gemini LLM
   * @param {string} artPrompt - The art prompt to base metadata on
   * @returns {Promise<object>} Generated metadata
   */
  async generateCollectionMetadata(artPrompt) {
    try {
      const metaPrompt = `
        Based on this art prompt: "${artPrompt}"
        
        Generate NFT collection metadata in the following JSON format:
        {
          "collection_name": "Creative collection name (max 50 characters)",
          "symbol": "3-6 character symbol (uppercase)",
          "description": "Engaging description (max 200 characters)"
        }
        
        Make sure the metadata is:
        - Professional and marketable
        - Relevant to the art prompt
        - Suitable for the Solana/Metaplex ecosystem
        
        Return only valid JSON, no additional text.
      `;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{ text: metaPrompt }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text.trim();
      
      // Extract JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const metadata = JSON.parse(jsonMatch[0]);
      console.log('📝 Generated collection metadata:', metadata);
      return metadata;
    } catch (error) {
      console.error('❌ Error generating collection metadata:', error.response?.data || error.message);
      throw new Error('Failed to generate collection metadata');
    }
  }

  /**
   * Generate image using Stability AI
   * @param {string} prompt - The art prompt
   * @param {string} jobId - Job ID for file naming
   * @param {object} advancedParams - Advanced AI parameters (optional)
   * @param {string} advancedParams.style_preset - Style preset for the image
   * @param {string} advancedParams.negative_prompt - What to avoid in the image
   * @param {number} advancedParams.seed - Seed for reproducible results
   * @returns {Promise<string>} Path to generated image
   */
  async generateImage(prompt, jobId, advancedParams = {}) {
    try {
      console.log(`🎨 Generating image for job ${jobId}...`);
      
      // Build request body with advanced parameters
      const requestBody = {
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: this.imageHeight,
        width: this.imageWidth,
        samples: 1,
        steps: 30
      };

      // Add negative prompt if provided
      if (advancedParams.negative_prompt && advancedParams.negative_prompt.trim()) {
        requestBody.text_prompts.push({
          text: advancedParams.negative_prompt,
          weight: -1
        });
      }

      // Add style preset if provided
      if (advancedParams.style_preset) {
        requestBody.style_preset = advancedParams.style_preset;
      }

      // Add seed if provided
      if (advancedParams.seed && !isNaN(advancedParams.seed)) {
        requestBody.seed = parseInt(advancedParams.seed);
      }

      console.log('🎨 Request body with advanced params:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.stabilityApiKey}`
          }
        }
      );

      const imageData = response.data.artifacts[0].base64;
      const imagePath = path.join(this.uploadsDir, `${jobId}.png`);
      
      // Save image to file
      fs.writeFileSync(imagePath, imageData, 'base64');
      
      console.log(`✅ Image generated and saved: ${imagePath}`);
      return imagePath;
    } catch (error) {
      console.error('❌ Error generating image:', error.response?.data || error.message);
      throw new Error(`Failed to generate image: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validate API keys
   * @returns {object} Validation results
   */
  validateApiKeys() {
    const results = {
      stabilityAI: !!this.stabilityApiKey,
      gemini: !!this.geminiApiKey
    };

    console.log('🔑 API Keys validation:', results);
    return results;
  }

  /**
   * Test API connections
   * @returns {Promise<object>} Test results
   */
  async testConnections() {
    const results = {
      stabilityAI: false,
      gemini: false
    };

    // Test Gemini API
    try {
      await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{ text: 'Hello, this is a test.' }]
          }]
        }
      );
      results.gemini = true;
    } catch (error) {
      console.error('❌ Gemini API test failed:', error.response?.data || error.message);
    }

    // Test Stability AI API
    try {
      await axios.get('https://api.stability.ai/v1/user/account', {
        headers: {
          'Authorization': `Bearer ${this.stabilityApiKey}`
        }
      });
      results.stabilityAI = true;
    } catch (error) {
      console.error('❌ Stability AI API test failed:', error.response?.data || error.message);
    }

    console.log('🧪 API Connection tests:', results);
    return results;
  }
}

module.exports = new AIService();