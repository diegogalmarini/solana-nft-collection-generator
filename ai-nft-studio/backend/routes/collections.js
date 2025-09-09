const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Job = require('../models/Job');
const aiService = require('../services/aiService');
const jobService = require('../services/jobService');
const metadataService = require('../services/metadataService');

/**
 * POST /api/collections
 * Create a new collection
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      symbol,
      description,
      collection_number,
      total_supply,
      drop_supply,
      drop_number,
      art_prompt
    } = req.body;

    // Validation
    if (!name || !symbol || !description || !collection_number || !total_supply || !drop_supply || !art_prompt) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'symbol', 'description', 'collection_number', 'total_supply', 'drop_supply', 'art_prompt']
      });
    }

    if (total_supply < drop_supply) {
      return res.status(400).json({
        error: 'Drop supply cannot be greater than total supply'
      });
    }

    // Create collection
    const collection = await Collection.create({
      name,
      symbol,
      description,
      collection_number,
      total_supply: parseInt(total_supply),
      drop_supply: parseInt(drop_supply),
      drop_number: parseInt(drop_number) || 1,
      art_prompt,
      status: 'created'
    });

    console.log(`✅ Collection created: ${collection.name} (${collection.id})`);

    res.status(201).json({
      success: true,
      collection
    });
  } catch (error) {
    console.error('❌ Error creating collection:', error);
    res.status(500).json({
      error: 'Failed to create collection',
      details: error.message
    });
  }
});

/**
 * GET /api/collections
 * Get all collections
 */
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.findAll();
    
    // Get job statistics for each collection
    const collectionsWithStats = await Promise.all(
      collections.map(async (collection) => {
        const stats = await Collection.getJobStats(collection.id);
        return {
          ...collection,
          stats
        };
      })
    );

    res.json({
      success: true,
      collections: collectionsWithStats
    });
  } catch (error) {
    console.error('❌ Error fetching collections:', error);
    res.status(500).json({
      error: 'Failed to fetch collections',
      details: error.message
    });
  }
});

/**
 * GET /api/collections/:id
 * Get a specific collection
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findById(id);
    
    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found'
      });
    }

    const stats = await Collection.getJobStats(id);
    
    res.json({
      success: true,
      collection: {
        ...collection,
        stats
      }
    });
  } catch (error) {
    console.error('❌ Error fetching collection:', error);
    res.status(500).json({
      error: 'Failed to fetch collection',
      details: error.message
    });
  }
});

/**
 * PUT /api/collections/:id
 * Update a collection
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found'
      });
    }

    const updatedCollection = await Collection.update(id, updates);
    
    res.json({
      success: true,
      collection: updatedCollection
    });
  } catch (error) {
    console.error('❌ Error updating collection:', error);
    res.status(500).json({
      error: 'Failed to update collection',
      details: error.message
    });
  }
});

/**
 * DELETE /api/collections/:id
 * Delete a collection
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found'
      });
    }

    // Delete all jobs for this collection
    await Job.deleteByCollectionId(id);
    
    // Delete the collection
    await Collection.delete(id);
    
    res.json({
      success: true,
      message: 'Collection and all associated jobs deleted'
    });
  } catch (error) {
    console.error('❌ Error deleting collection:', error);
    res.status(500).json({
      error: 'Failed to delete collection',
      details: error.message
    });
  }
});

/**
 * POST /api/collections/:id/generate-initial
 * Generate initial test batch (first 3 NFTs)
 */
router.post('/:id/generate-initial', async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found'
      });
    }

    // Check if initial batch already exists
    const existingJobs = await Job.findByCollectionId(id);
    if (existingJobs.length > 0) {
      return res.status(400).json({
        error: 'Initial batch already generated for this collection'
      });
    }

    // Update collection status
    await Collection.update(id, { status: 'generating_initial' });

    // Start initial batch generation
    const jobs = await jobService.createInitialBatch(id);
    
    res.json({
      success: true,
      message: 'Initial batch generation started',
      jobs: jobs.length,
      collection_id: id
    });
  } catch (error) {
    console.error('❌ Error generating initial batch:', error);
    
    // Update collection status to error
    try {
      await Collection.update(req.params.id, { status: 'error' });
    } catch (updateError) {
      console.error('❌ Error updating collection status:', updateError);
    }
    
    res.status(500).json({
      error: 'Failed to generate initial batch',
      details: error.message
    });
  }
});

/**
 * POST /api/collections/:id/continue-generation
 * Continue generation with next batch
 */
router.post('/:id/continue-generation', async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_size = 100 } = req.body;
    
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found'
      });
    }

    // Check if there are pending jobs
    const pendingJobs = await Job.findByCollectionId(id, 'pending');
    if (pendingJobs.length === 0) {
      return res.status(400).json({
        error: 'No pending jobs found for this collection'
      });
    }

    // Update collection status
    await Collection.update(id, { status: 'generating_batch' });

    // Start batch generation
    const processedJobs = await jobService.processBatch(id, batch_size);
    
    res.json({
      success: true,
      message: 'Batch generation started',
      processed_jobs: processedJobs.length,
      remaining_jobs: pendingJobs.length - processedJobs.length,
      collection_id: id
    });
  } catch (error) {
    console.error('❌ Error continuing generation:', error);
    
    // Update collection status to error
    try {
      await Collection.update(req.params.id, { status: 'error' });
    } catch (updateError) {
      console.error('❌ Error updating collection status:', updateError);
    }
    
    res.status(500).json({
      error: 'Failed to continue generation',
      details: error.message
    });
  }
});

/**
 * GET /api/collections/:id/jobs
 * Get all jobs for a collection
 */
router.get('/:id/jobs', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;
    
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found'
      });
    }

    const jobs = await Job.findByCollectionId(id, status, parseInt(limit), parseInt(offset));
    const totalJobs = await Job.countByCollectionId(id, status);
    
    res.json({
      success: true,
      jobs,
      pagination: {
        total: totalJobs,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + parseInt(limit)) < totalJobs
      }
    });
  } catch (error) {
    console.error('❌ Error fetching collection jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch collection jobs',
      details: error.message
    });
  }
});

/**
 * POST /api/collections/:id/package
 * Create downloadable package for approved NFTs
 */
router.post('/:id/package', async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found'
      });
    }

    // Check if there are approved jobs
    const approvedJobs = await Job.findByCollectionId(id, 'approved');
    if (approvedJobs.length === 0) {
      return res.status(400).json({
        error: 'No approved NFTs found for this collection'
      });
    }

    // Create package
    const packagePath = await metadataService.createCollectionPackage(id);
    
    // Update collection status
    await Collection.update(id, { 
      status: 'packaged',
      package_path: packagePath
    });
    
    res.json({
      success: true,
      message: 'Collection package created successfully',
      package_path: packagePath,
      approved_nfts: approvedJobs.length
    });
  } catch (error) {
    console.error('❌ Error creating package:', error);
    res.status(500).json({
      error: 'Failed to create package',
      details: error.message
    });
  }
});

/**
 * GET /api/collections/:id/download
 * Download collection package
 */
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found'
      });
    }

    if (!collection.package_path) {
      return res.status(400).json({
        error: 'Package not created yet. Please create package first.'
      });
    }

    const fs = require('fs');
    if (!fs.existsSync(collection.package_path)) {
      return res.status(404).json({
        error: 'Package file not found'
      });
    }

    const filename = `${collection.name.replace(/[^a-zA-Z0-9]/g, '_')}_${collection.collection_number}.zip`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/zip');
    
    const fileStream = fs.createReadStream(collection.package_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('❌ Error downloading package:', error);
    res.status(500).json({
      error: 'Failed to download package',
      details: error.message
    });
  }
});

module.exports = router;