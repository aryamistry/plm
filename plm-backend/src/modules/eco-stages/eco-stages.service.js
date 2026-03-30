const pool = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');

async function createStage({ name, sequence, requires_approval }, userId) {
  // Check sequence uniqueness
  const existing = await pool.query('SELECT id FROM eco_stages WHERE sequence = $1', [sequence]);
  if (existing.rows.length > 0) {
    const err = new Error('A stage with this sequence already exists.');
    err.statusCode = 409;
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO eco_stages (name, sequence, requires_approval) VALUES ($1, $2, $3) RETURNING *`,
    [name, sequence, requires_approval || false]
  );
  const stage = result.rows[0];

  await logAudit({
    action: 'ECO_STAGE_CREATED',
    entityType: 'eco_stage',
    entityId: stage.id,
    newValue: stage,
    performedBy: userId,
  });

  return stage;
}

async function getAllStages() {
  const result = await pool.query('SELECT * FROM eco_stages ORDER BY sequence ASC');
  return result.rows;
}

async function updateStage(id, { name, sequence, requires_approval }, userId) {
  // Check if stage exists
  const existing = await pool.query('SELECT * FROM eco_stages WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const err = new Error('ECO stage not found.');
    err.statusCode = 404;
    throw err;
  }
  const oldStage = existing.rows[0];

  // If changing sequence, check uniqueness
  if (sequence !== undefined && sequence !== oldStage.sequence) {
    const seqCheck = await pool.query('SELECT id FROM eco_stages WHERE sequence = $1 AND id != $2', [sequence, id]);
    if (seqCheck.rows.length > 0) {
      const err = new Error('A stage with this sequence already exists.');
      err.statusCode = 409;
      throw err;
    }
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
  if (sequence !== undefined) { fields.push(`sequence = $${idx++}`); values.push(sequence); }
  if (requires_approval !== undefined) { fields.push(`requires_approval = $${idx++}`); values.push(requires_approval); }

  if (fields.length === 0) {
    const err = new Error('No fields to update.');
    err.statusCode = 400;
    throw err;
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE eco_stages SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  const updatedStage = result.rows[0];

  await logAudit({
    action: 'ECO_STAGE_UPDATED',
    entityType: 'eco_stage',
    entityId: id,
    oldValue: oldStage,
    newValue: updatedStage,
    performedBy: userId,
  });

  return updatedStage;
}

async function deleteStage(id, userId) {
  // Check if any ECOs are at this stage
  const ecoCheck = await pool.query('SELECT id FROM ecos WHERE stage_id = $1 LIMIT 1', [id]);
  if (ecoCheck.rows.length > 0) {
    const err = new Error('Cannot delete stage: ECOs are currently at this stage.');
    err.statusCode = 400;
    throw err;
  }

  const existing = await pool.query('SELECT * FROM eco_stages WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const err = new Error('ECO stage not found.');
    err.statusCode = 404;
    throw err;
  }

  await pool.query('DELETE FROM eco_stages WHERE id = $1', [id]);

  await logAudit({
    action: 'ECO_STAGE_DELETED',
    entityType: 'eco_stage',
    entityId: id,
    oldValue: existing.rows[0],
    performedBy: userId,
  });

  return { message: 'ECO stage deleted successfully.' };
}

module.exports = { createStage, getAllStages, updateStage, deleteStage };
