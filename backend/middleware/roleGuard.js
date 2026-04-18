const userService = require('../services/userService');

function requireRole(requiredRole) {
  return async (req, res, next) => {
    try {
      const walletAddress = req.headers['x-wallet-address'] || req.body.wallet_address;

      if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required. Set x-wallet-address header.' });
      }

      const role = await userService.getUserRole(walletAddress);

      if (!role) {
        return res.status(403).json({ error: 'No role assigned. Please register first.' });
      }

      if (role !== requiredRole) {
        return res.status(403).json({
          error: `Access denied. Required role: ${requiredRole}, your role: ${role}`,
          requiredRole,
          actualRole: role,
        });
      }

      req.walletAddress = walletAddress;
      req.userRole = role;
      next();
    } catch (error) {
      console.error('Role guard error:', error);
      res.status(500).json({ error: 'Failed to verify role' });
    }
  };
}

const requireTeacher = requireRole('teacher');
const requireStudent = requireRole('student');

module.exports = { requireTeacher, requireStudent, requireRole };