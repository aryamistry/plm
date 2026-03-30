const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
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
app.use(helmet());

// CORS
app.use(cors({
  origin: env.ALLOWED_ORIGINS,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiting on API routes
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
