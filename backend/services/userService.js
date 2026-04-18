const models = require('../models');
const suiService = require('./suiService');
const config = require('../config');

class UserService {
  async createUser(data) {
    try {
      const { wallet_address, username, role, tx_digest } = data;

      if (tx_digest && config.sui.platformObjectId) {
        const verification = await suiService.verifyRegistrationTx(
          tx_digest,
          role,
          wallet_address
        );

        if (!verification.valid) {
          const err = new Error(`On-chain verification failed: ${verification.reason}`);
          err.status = 409;
          throw err;
        }
      }

      if (!username) {
        const autoUsername = wallet_address.slice(0, 6) + '...' + wallet_address.slice(-4);
        const existing = await models.UserProfile.findByPk(wallet_address);
        if (existing) {
          return { user: existing, created: false };
        }
        const [, created] = await models.UserProfile.findOrCreate({
          where: { wallet_address },
          defaults: {
            wallet_address,
            username: autoUsername,
            role,
          },
        });
      }

      const [user, created] = await models.UserProfile.findOrCreate({
        where: { wallet_address },
        defaults: {
          wallet_address,
          username: username || wallet_address.slice(0, 6) + '...' + wallet_address.slice(-4),
          role,
        },
      });

      if (!created && user.role !== role) {
        const err = new Error(`Wallet already registered as ${user.role}. Cannot change role.`);
        err.status = 409;
        throw err;
      }

      return { user, created };
    } catch (error) {
      if (error.status) throw error;
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUserByAddress(walletAddress) {
    try {
      let user = await models.UserProfile.findByPk(walletAddress, {
        include: [
          { model: models.Course, as: 'courses' },
          { model: models.Enrollment, as: 'enrollments' },
        ],
      });

      if (!user && config.sui.platformObjectId) {
        const onChainRole = await suiService.getOnChainRole(walletAddress);
        if (onChainRole) {
          const autoUsername = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
          const [syncedUser] = await models.UserProfile.findOrCreate({
            where: { wallet_address: walletAddress },
            defaults: {
              wallet_address: walletAddress,
              username: autoUsername,
              role: onChainRole,
            },
          });
          user = await models.UserProfile.findByPk(walletAddress, {
            include: [
              { model: models.Course, as: 'courses' },
              { model: models.Enrollment, as: 'enrollments' },
            ],
          });
        }
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  async getUserRole(walletAddress) {
    try {
      const user = await models.UserProfile.findByPk(walletAddress, {
        attributes: ['role'],
      });

      if (user) {
        return user.role;
      }

      if (config.sui.platformObjectId) {
        const onChainRole = await suiService.getOnChainRole(walletAddress);
        if (onChainRole) {
          const autoUsername = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
          await models.UserProfile.findOrCreate({
            where: { wallet_address: walletAddress },
            defaults: {
              wallet_address: walletAddress,
              username: autoUsername,
              role: onChainRole,
            },
          });
          return onChainRole;
        }
      }

      return null;
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

      const forbiddenFields = ['wallet_address', 'role'];
      const updateData = { ...data };
      forbiddenFields.forEach(field => delete updateData[field]);

      await user.update(updateData);
      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}

module.exports = new UserService();