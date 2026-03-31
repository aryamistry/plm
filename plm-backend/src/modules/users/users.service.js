const pool = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');

async function getAllUsers({ page, limit, offset }) {
  const countResult = await pool.query('SELECT COUNT(*) FROM users');
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT u.id, u.name, u.email, r.name AS role, r.id AS role_id, u.created_at
     FROM users u JOIN roles r ON u.role_id = r.id
     ORDER BY u.id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { users: result.rows, total };
}

async function getUserById(id) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, r.name AS role, r.id AS role_id, u.created_at
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

async function updateUser(id, { name, role_id }, performedBy) {
  const old = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (!old.rows.length) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

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

  const updated = result.rows[0];

  await logAudit({
    action: role_id !== undefined ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
    entityType: 'user',
    entityId: id,
    oldValue: { name: old.rows[0].name, role_id: old.rows[0].role_id },
    newValue: { name: updated.name, role_id: updated.role_id },
    performedBy,
  });

  return getUserById(id);
}

async function updateUserRole(userId, roleId, performedBy) {
  return updateUser(userId, { role_id: roleId }, performedBy);
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

module.exports = { getAllUsers, getUserById, updateUser, updateUserRole, deleteUser };
