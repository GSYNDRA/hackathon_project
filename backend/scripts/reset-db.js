require('dotenv').config();
const { sequelize } = require('../config/database');

async function resetDatabase() {
  try {
    console.log('⚠️  WARNING: This will delete all data!\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // Drop all tables and recreate
    await sequelize.sync({ force: true });
    console.log('✅ All tables dropped and recreated\n');
    
    console.log('🎉 Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  }
}

resetDatabase();
