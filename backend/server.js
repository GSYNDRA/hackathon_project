require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const config = require('./config');
const routes = require('./routes');
const { initializeWebSocket } = require('./utils/websocket');
const { sequelize, testConnection } = require('./config/database');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(express.json());

// Request logging (development only)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: config.nodeEnv === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize WebSocket server
initializeWebSocket(server);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync models (don't force in production)
    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized');
    }
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${config.port} is already in use.`);
        console.error(`   Another backend is probably still running. Kill it with:`);
        console.error(`   lsof -i :${config.port} -t | xargs kill\n`);
        process.exit(1);
      }
      console.error('❌ Server error:', err);
      process.exit(1);
    });

    server.listen(config.port, () => {
      console.log(`🚀 Server on :${config.port} · env=${config.nodeEnv} · WS ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };
