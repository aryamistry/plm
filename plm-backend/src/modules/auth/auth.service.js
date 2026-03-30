const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');
const env = require('../../config/env');
const { logAudit } = require('../../utils/auditLogger');

// In-memory refresh token store (hash -> userId mapping)
const refreshTokenStore = new Map();

async function signup({ name, email, password, role_id }) {
  // Check if email already exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered.');
    err.statusCode = 409;
    throw err;
  }

  // Validate role exists
  const roleResult = await pool.query('SELECT id, name FROM roles WHERE id = $1', [role_id]);
  if (roleResult.rows.length === 0) {
    const err = new Error('Invalid role_id.');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role_id, created_at`,
    [name, email, hashedPassword, role_id]
  );

  const user = result.rows[0];
  const role = roleResult.rows[0];

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

  // Store refresh token
  refreshTokenStore.set(refreshToken, user.id);

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
  if (!refreshTokenStore.has(refreshToken)) {
    const err = new Error('Invalid or revoked refresh token.');
    err.statusCode = 401;
    throw err;
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    const tokenPayload = { userId: decoded.userId, roleId: decoded.roleId, roleName: decoded.roleName };

    const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });

    return { accessToken };
  } catch (err) {
    refreshTokenStore.delete(refreshToken);
    const error = new Error('Invalid or expired refresh token.');
    error.statusCode = 401;
    throw error;
  }
}

function logout(refreshToken) {
  refreshTokenStore.delete(refreshToken);
}

module.exports = { signup, login, refreshAccessToken, logout };
