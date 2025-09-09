/**
 * Metadata Finalizer Utility
 * 
 * This utility helps finalize NFT metadata by replacing placeholder CIDs
 * with actual IPFS CIDs after images have been uploaded to IPFS.
 */

class MetadataFinalizer {
  /**
   * Replace placeholder CIDs in metadata JSON with actual IPFS CIDs
   * @param {Object} metadata - The metadata object to process
   * @param {Object} cidMapping - Mapping of placeholder CIDs to actual CIDs
   * @returns {Object} - Updated metadata with actual CIDs
   */
  static replaceCIDs(metadata, cidMapping) {
    if (!metadata || !cidMapping) {
      throw new Error('Metadata and CID mapping are required');
    }

    // Deep clone the metadata to avoid mutating the original
    const updatedMetadata = JSON.parse(JSON.stringify(metadata));

    // Recursively replace CIDs in the metadata
    this._replaceCIDsRecursive(updatedMetadata, cidMapping);

    return updatedMetadata;
  }

  /**
   * Recursively traverse and replace CIDs in nested objects
   * @param {*} obj - Current object/value being processed
   * @param {Object} cidMapping - CID mapping object
   */
  static _replaceCIDsRecursive(obj, cidMapping) {
    if (typeof obj === 'string') {
      // Check if the string is a placeholder CID that needs replacement
      for (const [placeholder, actualCID] of Object.entries(cidMapping)) {
        if (obj.includes(placeholder)) {
          return obj.replace(placeholder, actualCID);
        }
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = this._replaceCIDsRecursive(obj[i], cidMapping);
      }
    } else if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = this._replaceCIDsRecursive(obj[key], cidMapping);
        }
      }
    }

    return obj;
  }

  /**
   * Process a batch of metadata files
   * @param {Array} metadataArray - Array of metadata objects
   * @param {Object} cidMapping - Mapping of placeholder CIDs to actual CIDs
   * @returns {Array} - Array of updated metadata objects
   */
  static processBatch(metadataArray, cidMapping) {
    if (!Array.isArray(metadataArray)) {
      throw new Error('Metadata array is required');
    }

    return metadataArray.map(metadata => this.replaceCIDs(metadata, cidMapping));
  }

  /**
   * Generate a download link for finalized metadata
   * @param {Object|Array} metadata - Metadata object or array
   * @param {string} filename - Filename for the download
   * @returns {string} - Download URL
   */
  static generateDownloadLink(metadata, filename = 'metadata.json') {
    const jsonString = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  /**
   * Download finalized metadata as JSON file
   * @param {Object|Array} metadata - Metadata to download
   * @param {string} filename - Filename for the download
   */
  static downloadMetadata(metadata, filename = 'finalized-metadata.json') {
    const downloadUrl = this.generateDownloadLink(metadata, filename);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Validate metadata structure
   * @param {Object} metadata - Metadata object to validate
   * @returns {Object} - Validation result with isValid and errors
   */
  static validateMetadata(metadata) {
    const errors = [];
    
    if (!metadata) {
      errors.push('Metadata is required');
      return { isValid: false, errors };
    }

    // Check required NFT metadata fields
    const requiredFields = ['name', 'description', 'image'];
    
    for (const field of requiredFields) {
      if (!metadata[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate image URL format
    if (metadata.image && !this._isValidImageUrl(metadata.image)) {
      errors.push('Invalid image URL format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a URL is a valid image URL (supports IPFS and HTTP/HTTPS)
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether the URL is valid
   */
  static _isValidImageUrl(url) {
    if (typeof url !== 'string') return false;
    
    // Check for IPFS URLs
    if (url.startsWith('ipfs://') || url.startsWith('https://ipfs.io/ipfs/')) {
      return true;
    }
    
    // Check for HTTP/HTTPS URLs
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Extract all CID placeholders from metadata
   * @param {Object|Array} metadata - Metadata to scan
   * @returns {Set} - Set of unique placeholder CIDs found
   */
  static extractPlaceholders(metadata) {
    const placeholders = new Set();
    
    const extractFromValue = (value) => {
      if (typeof value === 'string') {
        // Look for placeholder patterns like {{CID_1}}, {placeholder}, etc.
        const matches = value.match(/\{\{?[^}]+\}\}?/g);
        if (matches) {
          matches.forEach(match => placeholders.add(match));
        }
      } else if (Array.isArray(value)) {
        value.forEach(extractFromValue);
      } else if (value && typeof value === 'object') {
        Object.values(value).forEach(extractFromValue);
      }
    };

    extractFromValue(metadata);
    return placeholders;
  }
}

export default MetadataFinalizer;