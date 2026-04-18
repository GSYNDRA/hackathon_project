require('dotenv').config();
const { sequelize } = require('../config/database');
const { exec } = require('child_process');
const path = require('path');

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('✅ All models synchronized\n');
    
    console.log('🎉 Database initialization complete!');
    console.log('\n💡 You can now generate models from existing database with:');
    console.log('   npm run db:sync\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('\n💡 Make sure Docker is running:');
    console.log('   docker-compose up -d\n');
    process.exit(1);
  }
}

initDatabase();
