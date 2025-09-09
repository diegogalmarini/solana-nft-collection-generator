const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const getColors = require('get-image-colors');
const crypto = require('crypto');
const JSZip = require('jszip');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1000 // Max 1000 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Utility functions
const createJobQueue = (rarityTiers, totalSupply) => {
  const jobQueue = [];
  let currentIndex = 0;
  
  for (const tier of rarityTiers) {
    const { type, nftCount, editionsPerImage, artIdPrefix, images } = tier;
    const imagesNeeded = Math.ceil(nftCount / editionsPerImage);
    
    if (images.length < imagesNeeded) {
      throw new Error(`Tier "${type}" needs ${imagesNeeded} images but only ${images.length} provided`);
    }
    
    for (let imageIndex = 0; imageIndex < imagesNeeded; imageIndex++) {
      const editionsForThisImage = Math.min(editionsPerImage, nftCount - (imageIndex * editionsPerImage));
      
      for (let edition = 1; edition <= editionsForThisImage; edition++) {
        jobQueue.push({
          sourceImage: images[imageIndex],
          rarityTier: type,
          artId: `${artIdPrefix}-${imageIndex + 1}`,
          editionNumber: edition,
          editionTotal: editionsForThisImage,
          globalIndex: currentIndex++
        });
      }
    }
  }
  
  return jobQueue;
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const calculateSHA256 = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const extractDominantColors = async (imageBuffer) => {
  try {
    const colors = await getColors(imageBuffer, 'image/png');
    return {
      palette_primary: colors[0]?.hex() || '#000000',
      palette_secondary: colors[1]?.hex() || '#000000'
    };
  } catch (error) {
    console.warn('Color extraction failed:', error.message);
    return {
      palette_primary: '#000000',
      palette_secondary: '#000000'
    };
  }
};

const generateMetadata = (job, collectionData, paddedIndex, options) => {
  const metadata = {
    name: `${collectionData.projectName} #${paddedIndex}`,
    symbol: collectionData.symbol,
    description: collectionData.description,
    seller_fee_basis_points: Math.round(collectionData.royaltyFee * 100),
    image: `ipfs://<CID>/${paddedIndex}.png`,
    external_url: collectionData.externalUrl || '',
    properties: {
      files: [
        {
          uri: `${paddedIndex}.png`,
          type: 'image/png'
        }
      ],
      category: 'image',
      creators: [
        {
          address: collectionData.creatorWallet,
          share: collectionData.creatorShare || 100
        }
      ]
    },
    collection: {
      name: collectionData.projectName,
      family: collectionData.symbol
    },
    attributes: [
      {
        trait_type: 'collection_number',
        value: collectionData.collectionNumber
      },
      {
        trait_type: 'season',
        value: collectionData.season
      },
      {
        trait_type: 'series_slug',
        value: collectionData.seriesSlug
      },
      {
        trait_type: 'rarity_tier',
        value: job.rarityTier
      },
      {
        trait_type: 'edition_total',
        value: job.editionTotal
      },
      {
        trait_type: 'edition_number',
        value: job.editionNumber
      },
      {
        trait_type: 'art_id',
        value: job.artId
      }
    ]
  };
  
  // Add optional color attributes
  if (options.colorPalette) {
    metadata.attributes.push(
      {
        trait_type: 'palette_primary',
        value: options.colorPalette.palette_primary
      },
      {
        trait_type: 'palette_secondary',
        value: options.colorPalette.palette_secondary
      }
    );
  }
  
  // Add optional SHA256 hash
  if (options.sha256Hash) {
    metadata.properties.sha256_hash = options.sha256Hash;
  }
  
  return metadata;
};

// Main API endpoint
app.post('/api/generate', upload.array('images'), async (req, res) => {
  try {
    const { collectionData, rarityTiers, totalSupply, advancedOptions } = JSON.parse(req.body.data);
    const uploadedFiles = req.files;
    
    console.log('Generation request received:', {
      projectName: collectionData.projectName,
      totalSupply,
      tiersCount: rarityTiers.length,
      filesCount: uploadedFiles.length
    });
    
    // Validate input
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }
    
    // Map uploaded files to rarity tiers
    const processedTiers = rarityTiers.map(tier => ({
      ...tier,
      images: uploadedFiles.filter(file => 
        file.fieldname.startsWith(`tier_${rarityTiers.indexOf(tier)}_`)
      )
    }));
    
    // Create job queue
    const jobQueue = createJobQueue(processedTiers, totalSupply);
    
    if (jobQueue.length !== totalSupply) {
      return res.status(400).json({ 
        error: `Job queue length (${jobQueue.length}) doesn't match total supply (${totalSupply})` 
      });
    }
    
    // Randomize if requested
    const finalQueue = advancedOptions.randomizeOrder ? shuffleArray(jobQueue) : jobQueue;
    
    // Create ZIP file
    const zip = new JSZip();
    const imagesFolder = zip.folder('images');
    const jsonFolder = zip.folder('json');
    
    // Process each NFT
    for (let i = 0; i < totalSupply; i++) {
      const paddedIndex = String(i).padStart(5, '0');
      const job = finalQueue[i];
      const imageBuffer = job.sourceImage.buffer;
      
      // Process image
      let processedImageBuffer = imageBuffer;
      try {
        // Convert to PNG if needed
        processedImageBuffer = await sharp(imageBuffer)
          .png()
          .toBuffer();
      } catch (error) {
        console.warn(`Image processing failed for ${paddedIndex}:`, error.message);
      }
      
      // Optional calculations
      const options = {};
      
      if (advancedOptions.calculateColorPalette) {
        options.colorPalette = await extractDominantColors(processedImageBuffer);
      }
      
      if (advancedOptions.calculateSHA256) {
        options.sha256Hash = calculateSHA256(processedImageBuffer);
      }
      
      // Generate metadata
      const metadata = generateMetadata(job, collectionData, paddedIndex, options);
      
      // Add files to ZIP
      imagesFolder.file(`${paddedIndex}.png`, processedImageBuffer);
      jsonFolder.file(`${paddedIndex}.json`, JSON.stringify(metadata, null, 2));
      
      // Progress logging
      if ((i + 1) % 100 === 0 || i === totalSupply - 1) {
        console.log(`Processed ${i + 1}/${totalSupply} NFTs`);
      }
    }
    
    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Send response
    const filename = `${collectionData.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_collection.zip`;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    
    console.log(`Generation completed: ${filename} (${zipBuffer.length} bytes)`);
    res.send(zipBuffer);
    
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Generation failed', 
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NFT Generator API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;