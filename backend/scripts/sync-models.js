#!/usr/bin/env node

/**
 * Script to generate Sequelize models from existing database
 * Run this after creating tables in PostgreSQL
 * 
 * Usage: npm run db:sync
 */

const { exec } = require('child_process');
const path = require('path');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5433;
const DB_NAME = process.env.DB_NAME || 'sui_teaching';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';

console.log('🔄 Generating Sequelize models from database...\n');
console.log(`   Host: ${DB_HOST}`);
console.log(`   Port: ${DB_PORT}`);
console.log(`   Database: ${DB_NAME}`);
console.log(`   User: ${DB_USER}\n`);

const command = `npx sequelize-auto -h ${DB_HOST} -d ${DB_NAME} -u ${DB_USER} -x ${DB_PASSWORD} -p ${DB_PORT} --dialect postgres -o ./models/auto/ --caseModel p --caseFile p --lang js --skipTables chain_events`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error generating models:', error.message);
    console.log('\n💡 Make sure sequelize-auto is installed:');
    console.log('   npm install -g sequelize-auto');
    console.log('\n💡 Make sure database is running:');
    console.log('   docker-compose up -d\n');
    process.exit(1);
  }
  
  console.log(stdout);
  
  if (stderr) {
    console.error('⚠️  Warnings:', stderr);
  }
  
  console.log('✅ Models generated successfully!');
  console.log('\n📁 Generated models location: ./models/auto/');
  console.log('\n💡 You can now import these models in your code:');
  console.log(`   const models = require('./models/auto');\n`);
  
  process.exit(0);
});
