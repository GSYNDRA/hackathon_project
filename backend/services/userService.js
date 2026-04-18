const models = require('../models');
const { Op } = require('sequelize');

class UserService {
  async createUser(data) {
    try {
      const [user, created] = await models.UserProfile.findOrCreate({
        where: { wallet_address: data.wallet_address },
        defaults: {
          wallet_address: data.wallet_address,
          username: data.username,
          role: data.role
        }
      });
      
      return { user, created };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUserByAddress(walletAddress) {
    try {
      const user = await models.UserProfile.findByPk(walletAddress, {
        include: [
          { model: models.Course, as: 'courses' },
          { model: models.Enrollment, as: 'enrollments' }
        ]
      });
      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  async getUserRole(walletAddress) {
    try {
      const user = await models.UserProfile.findByPk(walletAddress, {
        attributes: ['role']
      });
      return user ? user.role : null;
    } catch (error) {
      throw new Error(`Failed to get user role: ${error.message}`);
    }
  }

  async updateUser(walletAddress, data) {
    try {
      const user = await models.UserProfile.findByPk(walletAddress);
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.update(data);
      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}

module.exports = new UserService();
