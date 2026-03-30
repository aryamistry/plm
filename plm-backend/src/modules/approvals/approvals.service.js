const pool = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');
const ecosService = require('../ecos/ecos.service');

async function getPendingApprovals(userId) {
  const result = await pool.query(
    `SELECT ea.*, e.title AS eco_title, e.type AS eco_type, e.status AS eco_status,
            p.name AS product_name, es.name AS stage_name
     FROM eco_approvals ea
     JOIN ecos e ON e.id = ea.eco_id
     JOIN products p ON p.id = e.product_id
     LEFT JOIN eco_stages es ON es.id = e.stage_id
     WHERE ea.approver_id = $1 AND ea.status = 'PENDING'
     ORDER BY ea.id DESC`,
    [userId]
  );
  return result.rows;
}

async function approveEco(ecoId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate: requesting user has a PENDING approval record
    const approvalResult = await client.query(
      `SELECT * FROM eco_approvals WHERE eco_id = $1 AND approver_id = $2 AND status = 'PENDING'`,
      [ecoId, userId]
    );
    if (approvalResult.rows.length === 0) {
      const err = new Error('No pending approval found for this ECO and user.');
      err.statusCode = 400;
      throw err;
    }

    // Update approval
    await client.query(
      `UPDATE eco_approvals SET status = 'APPROVED', action_time = NOW() WHERE eco_id = $1 AND approver_id = $2`,
      [ecoId, userId]
    );

    await logAudit({
      action: 'ECO_APPROVED',
      entityType: 'eco_approval',
      entityId: ecoId,
      newValue: { approver_id: userId, status: 'APPROVED' },
      performedBy: userId,
      client,
    });

    // Check if ALL approvers have approved
    const pendingCount = await client.query(
      `SELECT COUNT(*) FROM eco_approvals WHERE eco_id = $1 AND status = 'PENDING'`,
      [ecoId]
    );

    if (parseInt(pendingCount.rows[0].count, 10) === 0) {
      // All approved — advance to next stage
      const ecoResult = await client.query('SELECT * FROM ecos WHERE id = $1', [ecoId]);
      const eco = ecoResult.rows[0];

      const currentStageResult = await client.query('SELECT * FROM eco_stages WHERE id = $1', [eco.stage_id]);
      const currentStage = currentStageResult.rows[0];

      const nextStageResult = await client.query(
        'SELECT * FROM eco_stages WHERE sequence > $1 ORDER BY sequence ASC LIMIT 1',
        [currentStage.sequence]
      );

      if (nextStageResult.rows.length === 0) {
        // No more stages — apply ECO
        await client.query('COMMIT');
        await ecosService.applyEco(ecoId, userId);
        return { message: 'All approved. ECO applied successfully.' };
      }

      const nextStage = nextStageResult.rows[0];

      if (nextStage.requires_approval) {
        // Create new approval records
        const approvers = await client.query(
          `SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'approver')`
        );
        for (const approver of approvers.rows) {
          await client.query(
            `INSERT INTO eco_approvals (eco_id, approver_id, status) VALUES ($1, $2, 'PENDING')`,
            [ecoId, approver.id]
          );
        }
      }

      await client.query(
        'UPDATE ecos SET stage_id = $1 WHERE id = $2',
        [nextStage.id, ecoId]
      );

      // Check if the next stage is the final one and doesn't require approval
      const furtherStages = await client.query(
        'SELECT * FROM eco_stages WHERE sequence > $1 ORDER BY sequence ASC LIMIT 1',
        [nextStage.sequence]
      );

      if (furtherStages.rows.length === 0 && !nextStage.requires_approval) {
        // Final stage, no approval needed — apply ECO
        await client.query('COMMIT');
        await ecosService.applyEco(ecoId, userId);
        return { message: 'All approved. ECO applied successfully.' };
      }
    }

    await client.query('COMMIT');
    return { message: 'Approval recorded successfully.' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function rejectEco(ecoId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate: requesting user has a PENDING approval record
    const approvalResult = await client.query(
      `SELECT * FROM eco_approvals WHERE eco_id = $1 AND approver_id = $2 AND status = 'PENDING'`,
      [ecoId, userId]
    );
    if (approvalResult.rows.length === 0) {
      const err = new Error('No pending approval found for this ECO and user.');
      err.statusCode = 400;
      throw err;
    }

    // Update this approval
    await client.query(
      `UPDATE eco_approvals SET status = 'REJECTED', action_time = NOW() WHERE eco_id = $1 AND approver_id = $2`,
      [ecoId, userId]
    );

    // Set ECO status to REJECTED
    await client.query(
      `UPDATE ecos SET status = 'REJECTED' WHERE id = $1`,
      [ecoId]
    );

    // Reject all other PENDING approvals
    await client.query(
      `UPDATE eco_approvals SET status = 'REJECTED', action_time = NOW() WHERE eco_id = $1 AND status = 'PENDING'`,
      [ecoId]
    );

    await logAudit({
      action: 'ECO_REJECTED',
      entityType: 'eco_approval',
      entityId: ecoId,
      newValue: { rejectedBy: userId },
      performedBy: userId,
      client,
    });

    await client.query('COMMIT');
    return { message: 'ECO rejected successfully.' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getPendingApprovals, approveEco, rejectEco };
