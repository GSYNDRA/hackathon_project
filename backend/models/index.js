const { sequelize } = require('../config/database');

// Import models
const UserProfile = require('./UserProfile');
const Course = require('./Course');
const ExamQuestion = require('./ExamQuestion');
const Enrollment = require('./Enrollment');
const Submission = require('./Submission');
const Result = require('./Result');

// Initialize models with sequelize
const models = {
  UserProfile: UserProfile(sequelize, require('sequelize').DataTypes),
  Course: Course(sequelize, require('sequelize').DataTypes),
  ExamQuestion: ExamQuestion(sequelize, require('sequelize').DataTypes),
  Enrollment: Enrollment(sequelize, require('sequelize').DataTypes),
  Submission: Submission(sequelize, require('sequelize').DataTypes),
  Result: Result(sequelize, require('sequelize').DataTypes),
};

// Setup associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = models;
