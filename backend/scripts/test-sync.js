require('dotenv').config();
const { sequelize } = require('./config/database');
const models = require('./models');

async function testSync() {
  try {
    console.log('🔄 Testing database connection...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // Sync models (alter: true updates tables without dropping data)
    console.log('🔄 Syncing models...\n');
    await sequelize.sync({ alter: true });
    console.log('✅ All models synchronized with database\n');
    
    // Test queries
    console.log('🔄 Testing queries...\n');
    
    const userCount = await models.UserProfile.count();
    console.log(`   User profiles: ${userCount}`);
    
    const courseCount = await models.Course.count();
    console.log(`   Courses: ${courseCount}`);
    
    const enrollmentCount = await models.Enrollment.count();
    console.log(`   Enrollments: ${enrollmentCount}`);
    
    console.log('\n✅ Database sync test completed successfully!');
    console.log('\n💡 You can now start the backend server:');
    console.log('   npm run dev\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    console.log('\n💡 Make sure Docker container is running:');
    console.log('   docker ps');
    console.log('\n💡 Check database connection settings in .env\n');
    process.exit(1);
  }
}

testSync();
