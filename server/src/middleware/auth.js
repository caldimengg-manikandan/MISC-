const jwt = require('jsonwebtoken');
const db = require('../config/mssql');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from MySQL
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request (removing sensitive fields)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    req.userId = user.id;
    req.userRole = user.role;

    // console.log('AUTH USER:', req.user.email, req.user.role);

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};
