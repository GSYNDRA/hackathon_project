const userService = require('../services/userService');
const suiService = require('../services/suiService');

class UserController {
  async register(req, res) {
    try {
      const { wallet_address, username, role, tx_digest } = req.body;

      if (!wallet_address || !role) {
        return res.status(400).json({ error: 'Wallet address and role are required' });
      }

      if (!['teacher', 'student'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be teacher or student' });
      }

      const { user, created } = await userService.createUser({
        wallet_address,
        username,
        role,
        tx_digest,
      });

      res.json({
        success: true,
        user,
        isNewUser: created,
      });
    } catch (error) {
      console.error('Register user error:', error);
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const { address } = req.params;

      const user = await userService.getUserByAddress(address);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getRole(req, res) {
    try {
      const { address } = req.params;

      const role = await userService.getUserRole(address);

      res.json({ role });
    } catch (error) {
      console.error('Get role error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getOnChainRole(req, res) {
    try {
      const { address } = req.params;

      if (!suiService.platformObjectId) {
        return res.status(503).json({
          error: 'Platform object ID not configured',
          role: null,
          source: 'unavailable',
        });
      }

      const role = await suiService.getOnChainRole(address);

      res.json({
        role,
        source: 'on-chain',
        address,
      });
    } catch (error) {
      console.error('Get on-chain role error:', error);
      res.status(500).json({
        error: error.message,
        role: null,
        source: 'error',
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { address } = req.params;
      const { username } = req.body;

      const user = await userService.updateUser(address, { username });

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();