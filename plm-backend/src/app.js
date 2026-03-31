const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const env = require('./config/env');
const pool = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const productsRoutes = require('./modules/products/products.routes');
const bomsRoutes = require('./modules/boms/boms.routes');
const ecoStagesRoutes = require('./modules/eco-stages/eco-stages.routes');
const ecosRoutes = require('./modules/ecos/ecos.routes');
const approvalsRoutes = require('./modules/approvals/approvals.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: env.ALLOWED_ORIGINS,
  credentials: true,
}));

// X-Request-ID header
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting on API routes
app.use('/api', apiLimiter);

// Health check with DB ping
app.get('/api/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'error';
  }
  res.json({
    success: true,
    data: {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      db: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/boms', bomsRoutes);
app.use('/api/eco-stages', ecoStagesRoutes);
app.use('/api/ecos', ecosRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/reports', reportsRoutes);

// Global error handler (must be after routes)
app.use(errorHandler);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

module.exports = app;
