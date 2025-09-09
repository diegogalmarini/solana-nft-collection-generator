const { v4: uuidv4 } = require('uuid');
const database = require('./database');

class Collection {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.symbol = data.symbol;
    this.description = data.description;
    this.collection_number = data.collection_number;
    this.total_supply = data.total_supply;
    this.drop_supply = data.drop_supply;
    this.drop_number = data.drop_number || 1;
    this.ai_prompt = data.ai_prompt;
    this.status = data.status || 'pending';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(collectionData) {
    const collection = new Collection(collectionData);
    const db = database.getDatabase();

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO collections (
          id, name, symbol, description, collection_number, 
          total_supply, drop_supply, drop_number, ai_prompt, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        collection.id,
        collection.name,
        collection.symbol,
        collection.description,
        collection.collection_number,
        collection.total_supply,
        collection.drop_supply,
        collection.drop_number,
        collection.ai_prompt,
        collection.status
      ], function(err) {
        if (err) {
          console.error('Error creating collection:', err);
          reject(err);
        } else {
          console.log(`✅ Collection created with ID: ${collection.id}`);
          resolve(collection);
        }
      });

      stmt.finalize();
    });
  }

  static async findById(id) {
    const db = database.getDatabase();

    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM collections WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new Collection(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  static async findAll(limit = 50, offset = 0) {
    const db = database.getDatabase();

    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM collections ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const collections = rows.map(row => new Collection(row));
            resolve(collections);
          }
        }
      );
    });
  }

  static async updateStatus(id, status) {
    const db = database.getDatabase();

    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE collections SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id],
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

  static async delete(id) {
    const db = database.getDatabase();

    return new Promise((resolve, reject) => {
      db.run('DELETE FROM collections WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static async getStats(id) {
    const db = database.getDatabase();

    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_jobs,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_jobs,
          SUM(CASE WHEN status = 'generating' THEN 1 ELSE 0 END) as generating_jobs,
          SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated_jobs,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_jobs,
          SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_jobs
        FROM jobs 
        WHERE collection_id = ?
      `, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || {});
        }
      });
    });
  }

  static async getJobStats(id) {
    return this.getStats(id);
  }
}

module.exports = Collection;