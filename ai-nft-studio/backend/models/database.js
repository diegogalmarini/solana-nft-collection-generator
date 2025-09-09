const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database/ai-nft-studio.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('📁 Connected to SQLite database at:', DB_PATH);
          resolve();
        }
      });
    });
  }

  initializeDatabase() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.connect();
        
        // Create collections table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS collections (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            symbol TEXT NOT NULL,
            description TEXT,
            collection_number TEXT NOT NULL,
            total_supply INTEGER NOT NULL,
            drop_supply INTEGER NOT NULL,
            drop_number INTEGER DEFAULT 1,
            ai_prompt TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create jobs table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            collection_id TEXT NOT NULL,
            edition_number INTEGER NOT NULL,
            edition_in_drop INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            image_url TEXT,
            image_path TEXT,
            metadata_path TEXT,
            ai_prompt TEXT,
            style_preset TEXT,
            negative_prompt TEXT,
            seed INTEGER,
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (collection_id) REFERENCES collections (id)
          )
        `);

        // Add new columns for advanced AI parameters if they don't exist
        this.db.run(`ALTER TABLE jobs ADD COLUMN style_preset TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding style_preset column:', err.message);
          }
        });
        
        this.db.run(`ALTER TABLE jobs ADD COLUMN negative_prompt TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding negative_prompt column:', err.message);
          }
        });
        
        this.db.run(`ALTER TABLE jobs ADD COLUMN seed INTEGER`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding seed column:', err.message);
          }
        });

        // Create indexes for better performance
        this.db.run('CREATE INDEX IF NOT EXISTS idx_jobs_collection_id ON jobs(collection_id)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status)');

        console.log('✅ Database tables initialized successfully');
        resolve();
      } catch (error) {
        console.error('❌ Error initializing database:', error);
        reject(error);
      }
    });
  }

  getDatabase() {
    return this.db;
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            reject(err);
          } else {
            console.log('📁 Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

const database = new Database();

module.exports = database;