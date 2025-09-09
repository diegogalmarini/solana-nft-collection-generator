const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Collection = require('../models/Collection');
const jobService = require('../services/jobService');
const metadataService = require('../services/metadataService');

/**
 * GET /api/jobs
 * Get all jobs with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { status, collection_id, limit = 50, offset = 0 } = req.query;
    
    let jobs;
    if (collection_id) {
      jobs = await Job.findByCollectionId(collection_id, status, parseInt(limit), parseInt(offset));
    } else {
      jobs = await Job.findAll(status, parseInt(limit), parseInt(offset));
    }
    
    res.json({
      success: true,
      jobs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch jobs',
      details: error.message
    });
  }
});

/**
 * GET /api/jobs/:id
 * Get a specific job
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('❌ Error fetching job:', error);
    res.status(500).json({
      error: 'Failed to fetch job',
      details: error.message
    });
  }
});

/**
 * PUT /api/jobs/:id
 * Update a job
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    const updatedJob = await Job.update(id, updates);
    
    res.json({
      success: true,
      job: updatedJob
    });
  } catch (error) {
    console.error('❌ Error updating job:', error);
    res.status(500).json({
      error: 'Failed to update job',
      details: error.message
    });
  }
});

/**
 * POST /api/jobs/:id/approve
 * Approve a generated job
 */
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    if (job.status !== 'generated') {
      return res.status(400).json({
        error: 'Job must be in generated status to approve',
        current_status: job.status
      });
    }

    // Approve the job
    const approvedJob = await jobService.approveJob(id);
    
    res.json({
      success: true,
      message: 'Job approved successfully',
      job: approvedJob
    });
  } catch (error) {
    console.error('❌ Error approving job:', error);
    res.status(500).json({
      error: 'Failed to approve job',
      details: error.message
    });
  }
});

/**
 * POST /api/jobs/:id/regenerate
 * Regenerate a job
 */
router.post('/:id/regenerate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    if (!['generated', 'error'].includes(job.status)) {
      return res.status(400).json({
        error: 'Job must be in generated or error status to regenerate',
        current_status: job.status
      });
    }

    // Regenerate the job
    const regeneratedJob = await jobService.regenerateJob(id);
    
    res.json({
      success: true,
      message: 'Job regeneration started',
      job: regeneratedJob
    });
  } catch (error) {
    console.error('❌ Error regenerating job:', error);
    res.status(500).json({
      error: 'Failed to regenerate job',
      details: error.message
    });
  }
});

/**
 * DELETE /api/jobs/:id
 * Delete a job
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    // Clean up associated files
    const fs = require('fs');
    if (job.image_path && fs.existsSync(job.image_path)) {
      fs.unlinkSync(job.image_path);
    }
    if (job.metadata_path && fs.existsSync(job.metadata_path)) {
      fs.unlinkSync(job.metadata_path);
    }

    await Job.delete(id);
    
    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting job:', error);
    res.status(500).json({
      error: 'Failed to delete job',
      details: error.message
    });
  }
});

/**
 * GET /api/jobs/:id/image
 * Get job image
 */
router.get('/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    if (!job.image_path) {
      return res.status(404).json({
        error: 'Image not available for this job'
      });
    }

    const fs = require('fs');
    if (!fs.existsSync(job.image_path)) {
      return res.status(404).json({
        error: 'Image file not found'
      });
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    const fileStream = fs.createReadStream(job.image_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('❌ Error serving job image:', error);
    res.status(500).json({
      error: 'Failed to serve image',
      details: error.message
    });
  }
});

/**
 * GET /api/jobs/:id/metadata
 * Get job metadata
 */
router.get('/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    if (!job.metadata_path) {
      return res.status(404).json({
        error: 'Metadata not available for this job'
      });
    }

    const fs = require('fs');
    if (!fs.existsSync(job.metadata_path)) {
      return res.status(404).json({
        error: 'Metadata file not found'
      });
    }

    const metadata = JSON.parse(fs.readFileSync(job.metadata_path, 'utf8'));
    
    res.json({
      success: true,
      metadata
    });
  } catch (error) {
    console.error('❌ Error serving job metadata:', error);
    res.status(500).json({
      error: 'Failed to serve metadata',
      details: error.message
    });
  }
});

/**
 * POST /api/jobs/batch-approve
 * Approve multiple jobs at once
 */
router.post('/batch-approve', async (req, res) => {
  try {
    const { job_ids } = req.body;
    
    if (!Array.isArray(job_ids) || job_ids.length === 0) {
      return res.status(400).json({
        error: 'job_ids must be a non-empty array'
      });
    }

    const results = [];
    const errors = [];

    for (const jobId of job_ids) {
      try {
        const job = await Job.findById(jobId);
        if (!job) {
          errors.push({ job_id: jobId, error: 'Job not found' });
          continue;
        }

        if (job.status !== 'generated') {
          errors.push({ job_id: jobId, error: 'Job must be in generated status to approve' });
          continue;
        }

        const approvedJob = await jobService.approveJob(jobId);
        results.push(approvedJob);
      } catch (error) {
        errors.push({ job_id: jobId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      approved: results.length,
      errors: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('❌ Error batch approving jobs:', error);
    res.status(500).json({
      error: 'Failed to batch approve jobs',
      details: error.message
    });
  }
});

/**
 * POST /api/jobs/batch-regenerate
 * Regenerate multiple jobs at once
 */
router.post('/batch-regenerate', async (req, res) => {
  try {
    const { job_ids } = req.body;
    
    if (!Array.isArray(job_ids) || job_ids.length === 0) {
      return res.status(400).json({
        error: 'job_ids must be a non-empty array'
      });
    }

    const results = [];
    const errors = [];

    for (const jobId of job_ids) {
      try {
        const job = await Job.findById(jobId);
        if (!job) {
          errors.push({ job_id: jobId, error: 'Job not found' });
          continue;
        }

        if (!['generated', 'error'].includes(job.status)) {
          errors.push({ job_id: jobId, error: 'Job must be in generated or error status to regenerate' });
          continue;
        }

        const regeneratedJob = await jobService.regenerateJob(jobId);
        results.push(regeneratedJob);
      } catch (error) {
        errors.push({ job_id: jobId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      regenerated: results.length,
      errors: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('❌ Error batch regenerating jobs:', error);
    res.status(500).json({
      error: 'Failed to batch regenerate jobs',
      details: error.message
    });
  }
});

/**
 * GET /api/jobs/stats
 * Get job statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { collection_id } = req.query;
    
    let stats;
    if (collection_id) {
      stats = await Collection.getJobStats(collection_id);
    } else {
      // Get global stats
      const allJobs = await Job.findAll();
      stats = {
        total: allJobs.length,
        pending: allJobs.filter(j => j.status === 'pending').length,
        generating: allJobs.filter(j => j.status === 'generating').length,
        generated: allJobs.filter(j => j.status === 'generated').length,
        approved: allJobs.filter(j => j.status === 'approved').length,
        error: allJobs.filter(j => j.status === 'error').length
      };
    }
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching job stats:', error);
    res.status(500).json({
      error: 'Failed to fetch job stats',
      details: error.message
    });
  }
});

module.exports = router;