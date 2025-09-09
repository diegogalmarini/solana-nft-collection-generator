const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

class MetadataService {
  constructor() {
    this.outputDir = process.env.OUTPUT_DIR || './output';
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate NFT metadata for a job
   * @param {Job} job - Job object
   * @param {Collection} collection - Collection object
   * @returns {object} NFT metadata
   */
  generateNFTMetadata(job, collection) {
    const metadata = {
      name: `${collection.name} #${job.edition_in_drop}`,
      symbol: collection.symbol,
      description: collection.description,
      image: `${job.edition_in_drop}.png`,
      external_url: "https://mintonaire.io",
      attributes: [
        {
          trait_type: "Collection Number",
          value: collection.collection_number
        },
        {
          trait_type: "Drop Supply",
          value: collection.drop_supply.toString()
        },
        {
          trait_type: "Drop Number",
          value: collection.drop_number.toString()
        },
        {
          trait_type: "Edition in Drop",
          value: job.edition_in_drop.toString()
        },
        {
          trait_type: "Generation Method",
          value: "AI Generated"
        },
        {
          trait_type: "Rarity",
          value: this.calculateRarity(job.edition_in_drop, collection.drop_supply)
        }
      ],
      properties: {
        files: [
          {
            uri: `${job.edition_in_drop}.png`,
            type: "image/png"
          }
        ],
        category: "image",
        creators: [
          {
            address: "mintonaire_creator_address", // This should be replaced with actual creator address
            share: 100
          }
        ]
      },
      collection: {
        name: collection.name,
        family: "Mintonaire AI Collection"
      }
    };

    console.log(`📝 Generated metadata for ${collection.name} #${job.edition_in_drop}`);
    return metadata;
  }

  /**
   * Calculate rarity based on edition number
   * @param {number} editionNumber - Edition number
   * @param {number} totalSupply - Total supply
   * @returns {string} Rarity level
   */
  calculateRarity(editionNumber, totalSupply) {
    const percentage = (editionNumber / totalSupply) * 100;
    
    if (percentage <= 1) return "Legendary";
    if (percentage <= 5) return "Epic";
    if (percentage <= 15) return "Rare";
    if (percentage <= 40) return "Uncommon";
    return "Common";
  }

  /**
   * Save metadata to file
   * @param {string} jobId - Job ID
   * @param {object} metadata - Metadata object
   * @returns {Promise<string>} Path to saved metadata file
   */
  async saveMetadata(jobId, metadata) {
    try {
      const metadataPath = path.join(this.outputDir, `${jobId}.json`);
      
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`💾 Metadata saved: ${metadataPath}`);
      return metadataPath;
    } catch (error) {
      console.error('❌ Error saving metadata:', error);
      throw error;
    }
  }

  /**
   * Generate collection metadata file
   * @param {Collection} collection - Collection object
   * @returns {object} Collection metadata
   */
  generateCollectionMetadata(collection) {
    const collectionMetadata = {
      name: collection.name,
      symbol: collection.symbol,
      description: collection.description,
      image: "collection.png", // Collection cover image
      external_url: "https://mintonaire.io",
      attributes: [
        {
          trait_type: "Collection Number",
          value: collection.collection_number
        },
        {
          trait_type: "Total Supply",
          value: collection.total_supply.toString()
        },
        {
          trait_type: "Drop Supply",
          value: collection.drop_supply.toString()
        },
        {
          trait_type: "Drop Number",
          value: collection.drop_number.toString()
        },
        {
          trait_type: "Generation Type",
          value: "AI Powered"
        }
      ],
      properties: {
        category: "image",
        creators: [
          {
            address: "mintonaire_creator_address", // This should be replaced with actual creator address
            share: 100
          }
        ]
      },
      collection: {
        name: collection.name,
        family: "Mintonaire AI Collection"
      }
    };

    return collectionMetadata;
  }

  /**
   * Create ZIP package with approved images and metadata
   * @param {string} collectionId - Collection ID
   * @returns {Promise<string>} Path to ZIP file
   */
  async createCollectionPackage(collectionId) {
    try {
      console.log(`📦 Creating collection package for ${collectionId}`);
      
      const Job = require('../models/Job');
      const Collection = require('../models/Collection');
      
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      const approvedJobs = await Job.findByCollectionId(collectionId, 'approved');
      if (approvedJobs.length === 0) {
        throw new Error('No approved jobs found for collection');
      }

      const zipPath = path.join(this.outputDir, `${collection.name.replace(/[^a-zA-Z0-9]/g, '_')}_${collection.collection_number}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          console.log(`✅ Collection package created: ${zipPath} (${archive.pointer()} bytes)`);
          resolve(zipPath);
        });

        archive.on('error', (err) => {
          console.error('❌ Error creating ZIP archive:', err);
          reject(err);
        });

        archive.pipe(output);

        // Add collection metadata
        const collectionMetadata = this.generateCollectionMetadata(collection);
        archive.append(JSON.stringify(collectionMetadata, null, 2), { name: 'collection.json' });

        // Add approved images and metadata
        approvedJobs.forEach((job, index) => {
          const editionNumber = job.edition_in_drop;
          
          // Add image
          if (job.image_path && fs.existsSync(job.image_path)) {
            archive.file(job.image_path, { name: `${editionNumber}.png` });
          }
          
          // Add metadata
          if (job.metadata_path && fs.existsSync(job.metadata_path)) {
            archive.file(job.metadata_path, { name: `${editionNumber}.json` });
          }
        });

        // Add README file
        const readmeContent = this.generateReadme(collection, approvedJobs.length);
        archive.append(readmeContent, { name: 'README.md' });

        archive.finalize();
      });
    } catch (error) {
      console.error('❌ Error creating collection package:', error);
      throw error;
    }
  }

  /**
   * Generate README content for the package
   * @param {Collection} collection - Collection object
   * @param {number} approvedCount - Number of approved NFTs
   * @returns {string} README content
   */
  generateReadme(collection, approvedCount) {
    return `# ${collection.name}

## Collection Information

- **Name:** ${collection.name}
- **Symbol:** ${collection.symbol}
- **Description:** ${collection.description}
- **Collection Number:** ${collection.collection_number}
- **Drop Supply:** ${collection.drop_supply}
- **Drop Number:** ${collection.drop_number}
- **Approved NFTs:** ${approvedCount}

## Package Contents

- \`collection.json\` - Collection metadata
- \`{edition}.png\` - NFT images (1200x1200px)
- \`{edition}.json\` - Individual NFT metadata
- \`README.md\` - This file

## Metadata Structure

Each NFT includes the following attributes:
- Collection Number
- Drop Supply
- Drop Number
- Edition in Drop
- Generation Method (AI Generated)
- Rarity (based on edition number)

## Metaplex Compatibility

This package is designed to be compatible with the Metaplex NFT standard on Solana.
All metadata follows the Metaplex JSON schema requirements.

## Generated by

AI-Powered Solana NFT Studio for Mintonaire.io
Generated on: ${new Date().toISOString()}
`;
  }

  /**
   * Clean up temporary files
   * @param {string} collectionId - Collection ID
   * @returns {Promise<void>}
   */
  async cleanupTempFiles(collectionId) {
    try {
      const Job = require('../models/Job');
      const jobs = await Job.findByCollectionId(collectionId);
      
      jobs.forEach(job => {
        // Clean up image files
        if (job.image_path && fs.existsSync(job.image_path)) {
          fs.unlinkSync(job.image_path);
        }
        
        // Clean up metadata files
        if (job.metadata_path && fs.existsSync(job.metadata_path)) {
          fs.unlinkSync(job.metadata_path);
        }
      });
      
      console.log(`🧹 Cleaned up temporary files for collection ${collectionId}`);
    } catch (error) {
      console.error('❌ Error cleaning up temp files:', error);
      throw error;
    }
  }
}

module.exports = new MetadataService();