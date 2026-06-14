const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `../.env.${env}`);

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

async function initDb() {
  console.log('Initializing PostgreSQL database...');
  
  // Connection config for default postgres database
  const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'postgres' // Connect to default postgres DB first
  };

  const client = new Client(config);
  
  try {
    await client.connect();
    
    // Check if enterprise_hrms exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'enterprise_hrms'"
    );

    if (res.rows.length === 0) {
      console.log("Database 'enterprise_hrms' does not exist. Creating...");
      // CREATE DATABASE cannot run inside a transaction block, run it directly
      await client.query('CREATE DATABASE enterprise_hrms');
      console.log("Database 'enterprise_hrms' created successfully.");
    } else {
      console.log("Database 'enterprise_hrms' already exists.");
    }
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    // If password failed or other errors, print details
    console.error('Please verify PostgreSQL credentials in your .env.development file.');
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
