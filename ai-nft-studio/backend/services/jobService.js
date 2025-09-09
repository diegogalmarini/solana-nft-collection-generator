const Job = require('../models/Job');
const Collection = require('../models/Collection');
const aiService = require('./aiService');
const metadataService = require('./metadataService');
const fs = require('fs');
const path = require('path');

class JobService {
  constructor() {
    this.isProcessing = false;
    this.currentBatch = [];
    this.initialBatchSize = parseInt(process.env.INITIAL_BATCH_SIZE) || 3;
    this.continueBatchSize = parseInt(process.env.CONTINUE_BATCH_SIZE) || 100;
  }

  /**
   * Create jobs for a collection
   * @param {string} collectionId - Collection ID
   * @param {number} totalSupply - Total number of NFTs
   * @param {string} aiPrompt - AI prompt for generation
   * @returns {Promise<Array>} Created jobs
   */
  async createJobsForCollection(collectionId, totalSupply, aiPrompt) {
    try {
      console.log(`📋 Creating ${totalSupply} jobs for collection ${collectionId}`);
      const jobs = await Job.createBatch(collectionId, totalSupply, aiPrompt);
      return jobs;
    } catch (error) {
      console.error('❌ Error creating jobs:', error);
      throw error;
    }
  }

  /**
   * Process initial batch of jobs (first 3)
   * @param {string} collectionId - Collection ID
   * @returns {Promise<Array>} Processed jobs
   */
  async processInitialBatch(collectionId) {
    try {
      if (this.isProcessing) {
        throw new Error('Job processing already in progress');
      }

      this.isProcessing = true;
      console.log(`🚀 Starting initial batch processing for collection ${collectionId}`);

      const pendingJobs = await Job.findByCollectionId(collectionId, 'pending', this.initialBatchSize);
      
      if (pendingJobs.length === 0) {
        throw new Error('No pending jobs found');
      }

      const processedJobs = [];

      for (const job of pendingJobs) {
        try {
          await this.processJob(job);
          processedJobs.push(job);
        } catch (error) {
          console.error(`❌ Error processing job ${job.id}:`, error);
          await Job.updateStatus(job.id, 'error', {
            error_message: error.message
          });
          await Job.incrementRetryCount(job.id);
        }
      }

      this.isProcessing = false;
      console.log(`✅ Initial batch completed. Processed ${processedJobs.length} jobs`);
      return processedJobs;
    } catch (error) {
      this.isProcessing = false;
      console.error('❌ Error in initial batch processing:', error);
      throw error;
    }
  }

  /**
   * Continue processing next batch of jobs
   * @param {string} collectionId - Collection ID
   * @returns {Promise<Array>} Processed jobs
   */
  async continueBatchProcessing(collectionId) {
    try {
      if (this.isProcessing) {
        throw new Error('Job processing already in progress');
      }

      this.isProcessing = true;
      console.log(`🔄 Continuing batch processing for collection ${collectionId}`);

      const pendingJobs = await Job.findByCollectionId(collectionId, 'pending', this.continueBatchSize);
      
      if (pendingJobs.length === 0) {
        console.log('✅ No more pending jobs to process');
        this.isProcessing = false;
        return [];
      }

      const processedJobs = [];

      for (const job of pendingJobs) {
        try {
          await this.processJob(job);
          processedJobs.push(job);
        } catch (error) {
          console.error(`❌ Error processing job ${job.id}:`, error);
          await Job.updateStatus(job.id, 'error', {
            error_message: error.message
          });
          await Job.incrementRetryCount(job.id);
        }
      }

      this.isProcessing = false;
      console.log(`✅ Batch completed. Processed ${processedJobs.length} jobs`);
      return processedJobs;
    } catch (error) {
      this.isProcessing = false;
      console.error('❌ Error in batch processing:', error);
      throw error;
    }
  }

  /**
   * Process a single job
   * @param {Job} job - Job to process
   * @returns {Promise<void>}
   */
  async processJob(job) {
    try {
      console.log(`🎨 Processing job ${job.id} (Edition ${job.edition_number})`);
      
      // Update status to generating
      await Job.updateStatus(job.id, 'generating');

      // Generate image
      const imagePath = await aiService.generateImage(job.ai_prompt, job.id);
      
      // Update job with image path
      await Job.updateStatus(job.id, 'generated', {
        image_path: imagePath
      });

      console.log(`✅ Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Approve a job
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async approveJob(jobId) {
    try {
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (job.status !== 'generated') {
        throw new Error('Job must be in generated status to approve');
      }

      // Generate metadata for approved job
      const collection = await Collection.findById(job.collection_id);
      const metadata = await metadataService.generateNFTMetadata(job, collection);
      const metadataPath = await metadataService.saveMetadata(job.id, metadata);

      await Job.updateStatus(jobId, 'approved', {
        metadata_path: metadataPath
      });

      console.log(`✅ Job ${jobId} approved`);
      return true;
    } catch (error) {
      console.error(`❌ Error approving job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Regenerate a job
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async regenerateJob(jobId) {
    try {
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Delete old image if exists
      if (job.image_path && fs.existsSync(job.image_path)) {
        fs.unlinkSync(job.image_path);
      }

      // Reset job status and process again
      await Job.updateStatus(jobId, 'pending', {
        image_path: null,
        metadata_path: null,
        error_message: null
      });

      await this.processJob(job);
      
      console.log(`🔄 Job ${jobId} regenerated`);
      return true;
    } catch (error) {
      console.error(`❌ Error regenerating job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get collection progress
   * @param {string} collectionId - Collection ID
   * @returns {Promise<object>} Progress information
   */
  async getCollectionProgress(collectionId) {
    try {
      const stats = await Collection.getStats(collectionId);
      const collection = await Collection.findById(collectionId);
      
      const progress = {
        collection_id: collectionId,
        collection_name: collection?.name || 'Unknown',
        total_jobs: stats.total_jobs || 0,
        pending_jobs: stats.pending_jobs || 0,
        generating_jobs: stats.generating_jobs || 0,
        generated_jobs: stats.generated_jobs || 0,
        approved_jobs: stats.approved_jobs || 0,
        error_jobs: stats.error_jobs || 0,
        progress_percentage: stats.total_jobs > 0 ? 
          Math.round(((stats.approved_jobs || 0) / stats.total_jobs) * 100) : 0,
        is_processing: this.isProcessing,
        can_continue: (stats.pending_jobs || 0) > 0 && !this.isProcessing
      };

      return progress;
    } catch (error) {
      console.error('❌ Error getting collection progress:', error);
      throw error;
    }
  }

  /**
   * Get jobs by status for a collection
   * @param {string} collectionId - Collection ID
   * @param {string} status - Job status
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Jobs
   */
  async getJobsByStatus(collectionId, status, limit = null) {
    try {
      return await Job.findByCollectionId(collectionId, status, limit);
    } catch (error) {
      console.error('❌ Error getting jobs by status:', error);
      throw error;
    }
  }

  /**
   * Check if processing is in progress
   * @returns {boolean} Processing status
   */
  isProcessingInProgress() {
    return this.isProcessing;
  }
}

module.exports = new JobService();