const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const logger = require('../config/logger');

const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Function to generate daily backup JSON
async function backupDatabase() {
  logger.info('Starting daily automated backup job...');
  try {
    const backupData = {};

    // Fetch key database tables
    const users = await db.query('SELECT id, email, role, department_id, is_active FROM users');
    const profiles = await db.query('SELECT * FROM employee_profiles');
    const leaves = await db.query('SELECT * FROM leave_applications');
    const assets = await db.query('SELECT * FROM assets');

    backupData.timestamp = new Date().toISOString();
    backupData.users = users.rows;
    backupData.profiles = profiles.rows;
    backupData.leaves = leaves.rows;
    backupData.assets = assets.rows;

    const fileName = `backup_${Date.now()}.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
    logger.info(`Automated backup created successfully: ${filePath}`);
  } catch (error) {
    logger.error(`Automated backup job failed: ${error.message}`);
  }
}

// Schedule tasks: Run every night at midnight (0 0 * * *)
// For demonstration/verification, we can schedule it or export it to run manually.
const scheduleJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    await backupDatabase();
  });
  logger.info('Background cron jobs scheduled.');
};

module.exports = {
  scheduleJobs,
  backupDatabase,
};
