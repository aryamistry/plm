const pool = require('../../config/db');

async function getAllUsers({ page, limit, offset }) {
  const countResult = await pool.query('SELECT COUNT(*) FROM users');
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT u.id, u.name, u.email, r.name AS role, u.created_at
     FROM users u JOIN roles r ON u.role_id = r.id
     ORDER BY u.id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { users: result.rows, total };
}

async function getUserById(id) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, r.name AS role, u.created_at
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
}

async function updateUser(id, { name, role_id }) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (role_id !== undefined) {
    fields.push(`role_id = $${idx++}`);
    values.push(role_id);
  }

  if (fields.length === 0) {
    const err = new Error('No fields to update.');
    err.statusCode = 400;
    throw err;
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, role_id, created_at`,
    values
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
}

async function deleteUser(id) {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
}

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
