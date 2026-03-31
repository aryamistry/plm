const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../../config/db');
const env = require('../../config/env');
const { logAudit } = require('../../utils/auditLogger');

async function signup({ name, email, password }) {
  // Check if email already exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered.');
    err.statusCode = 409;
    throw err;
  }

  // Check if this is the very first user — if so, make them admin
  const userCount = await pool.query('SELECT COUNT(*) FROM users');
  const isFirstUser = parseInt(userCount.rows[0].count, 10) === 0;

  const roleName = isFirstUser ? 'admin' : 'operations';
  const roleResult = await pool.query(
    `SELECT id, name FROM roles WHERE name = $1`, [roleName]
  );
  if (roleResult.rows.length === 0) {
    const err = new Error('Role not configured. Contact administrator.');
    err.statusCode = 500;
    throw err;
  }
  const role = roleResult.rows[0];

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role_id, created_at`,
    [name, email, hashedPassword, role.id]
  );

  const user = result.rows[0];

  await logAudit({
    action: 'USER_CREATED',
    entityType: 'user',
    entityId: user.id,
    newValue: { id: user.id, name: user.name, email: user.email, role: role.name },
    performedBy: user.id,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role.name,
  };
}

async function login({ email, password }) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.password, u.role_id, r.name AS role_name
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const tokenPayload = { userId: user.id, roleId: user.role_id, roleName: user.role_name };

  const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(tokenPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  // Store hashed refresh token in DB
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
    },
  };
}

async function refreshAccessToken(refreshToken) {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const stored = await pool.query(
    `SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
    [tokenHash]
  );

  if (stored.rows.length === 0) {
    const err = new Error('Invalid or expired refresh token.');
    err.statusCode = 401;
    throw err;
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    
    // Fetch latest user info from DB to ensure role changes take effect immediately
    const userRes = await pool.query(
      `SELECT u.role_id, r.name AS role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      throw new Error('User no longer exists.');
    }

    const { role_id, role_name } = userRes.rows[0];
    const tokenPayload = { userId: decoded.userId, roleId: role_id, roleName: role_name };

    const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });

    return { accessToken };
  } catch (err) {
    // Revoke invalid token
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    const error = new Error('Invalid or expired refresh token.');
    error.statusCode = 401;
    throw error;
  }
}

async function logout(refreshToken) {
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  }
}

module.exports = { signup, login, refreshAccessToken, logout };
