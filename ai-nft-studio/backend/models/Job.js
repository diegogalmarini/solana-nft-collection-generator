const { v4: uuidv4 } = require('uuid');
const database = require('./database');

class Job {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.collection_id = data.collection_id;
    this.edition_number = data.edition_number;
    this.edition_in_drop = data.edition_in_drop;
    this.status = data.status || 'pending';
    this.image_url = data.image_url;
    this.image_path = data.image_path;
    this.metadata_path = data.metadata_path;
    this.ai_prompt = data.ai_prompt;
    this.style_preset = data.style_preset;
    this.negative_prompt = data.negative_prompt;
    this.seed = data.seed;
    this.error_message = data.error_message;
    this.retry_count = data.retry_count || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(jobData) {
    const job = new Job(jobData);
    const db = database.getDatabase();

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO jobs (
          id, collection_id, edition_number, edition_in_drop, 
          status, ai_prompt, style_preset, negative_prompt, seed, retry_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        job.id,
        job.collection_id,
        job.edition_number,
        job.edition_in_drop,
        job.status,
        job.ai_prompt,
        job.style_preset,
        job.negative_prompt,
        job.seed,
        job.retry_count
      ], function(err) {
        if (err) {
          console.error('Error creating job:', err);
          reject(err);
        } else {
          resolve(job);
        }
      });

      stmt.finalize();
    });
  }

  /**
   * Create multiple jobs for a collection
   * @param {string} collectionId - Collection ID
   * @param {number} totalSupply - Number of jobs to create
   * @param {string} aiPrompt - AI prompt for generation
   * @param {object} advancedParams - Advanced AI parameters
   * @returns {Promise<Array>} Created jobs
   */
  static async createBatch(collectionId, totalSupply, aiPrompt, advancedParams = {}) {
    const jobs = [];
    const db = database.getDatabase();
    const { style_preset, negative_prompt, seed } = advancedParams;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const stmt = db.prepare(`
          INSERT INTO jobs (
            id, collection_id, edition_number, edition_in_drop, 
            status, ai_prompt, style_preset, negative_prompt, seed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (let i = 1; i <= totalSupply; i++) {
          const job = new Job({
            collection_id: collectionId,
            edition_number: i,
            edition_in_drop: i,
            ai_prompt: aiPrompt,
            style_preset: style_preset || null,
            negative_prompt: negative_prompt || null,
            seed: seed || null
          });

          stmt.run([
            job.id,
            job.collection_id,
            job.edition_number,
            job.edition_in_drop,
            job.status,
            job.ai_prompt,
            job.style_preset,
            job.negative_prompt,
            job.seed
          ]);

          jobs.push(job);
        }

        stmt.finalize((err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
          } else {
            db.run('COMMIT', (err) => {
              if (err) {
                reject(err);
              } else {
                console.log(`✅ Created ${totalSupply} jobs for collection ${collectionId}`);
                resolve(jobs);
              }
            });
          }
        });
      });
    });
  }

  static async findById(id) {
    const db = database.getDatabase();

    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM jobs WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new Job(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  static async findByCollectionId(collectionId, status = null, limit = null) {
    const db = database.getDatabase();
    let query = 'SELECT * FROM jobs WHERE collection_id = ?';
    const params = [collectionId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY edition_number ASC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const jobs = rows.map(row => new Job(row));
          resolve(jobs);
        }
      });
    });
  }

  static async updateStatus(id, status, additionalData = {}) {
    const db = database.getDatabase();
    const fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];

    // Add additional fields to update
    Object.keys(additionalData).forEach(key => {
      fields.push(`${key} = ?`);
      params.push(additionalData[key]);
    });

    params.push(id);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  static async incrementRetryCount(id) {
    const db = database.getDatabase();

    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE jobs SET retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  static async deleteByCollectionId(collectionId) {
    const db = database.getDatabase();

    return new Promise((resolve, reject) => {
      db.run('DELETE FROM jobs WHERE collection_id = ?', [collectionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }
}

module.exports = Job;