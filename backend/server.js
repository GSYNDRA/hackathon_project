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
    
    server.listen(config.port, () => {
      console.log(`\n🚀 Server running on port ${config.port}`);
      console.log(`🌐 Environment: ${config.nodeEnv}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`\n📚 API Documentation:`);
      console.log(`   Health Check: GET http://localhost:${config.port}/health`);
      console.log(`   API Routes:   http://localhost:${config.port}/api`);
      console.log(`\n💡 Make sure your Docker PostgreSQL is running on port 5433`);
      console.log(`   docker-compose up -d\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };
