const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { protect } = require('./middleware/authMiddleware');
const upload = require('./utils/uploader');
const cronJobs = require('./utils/cronJobs');

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `.env.${env}`);
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const assetRoutes = require('./routes/assetRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // For local dev ease, we can configure specific domain later
  credentials: true,
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Logger middleware for incoming requests
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// File Upload Endpoint
app.post('/api/upload', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]), (req, res, next) => {
  try {
    const data = {};
    if (req.files?.avatar) {
      data.avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.files.avatar[0].filename}`;
    }
    if (req.files?.documents) {
      data.documentUrls = req.files.documents.map(
        (file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      );
    }
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/assets', assetRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', env: process.env.NODE_ENV });
});

// Centralized error handler
app.use(errorHandler);

// Start Cron background tasks
cronJobs.scheduleJobs();

// Listen
app.listen(PORT, () => {
  logger.info(`Server running in ${env} mode on port ${PORT}`);
});

module.exports = app; // For testing purposes
