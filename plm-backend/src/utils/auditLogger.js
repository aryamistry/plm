const pool = require('../config/db');

/**
 * Centralized audit log writer.
 * @param {Object} params
 * @param {string} params.action - e.g. 'USER_CREATED', 'ECO_SUBMITTED'
 * @param {string} params.entityType - e.g. 'user', 'eco', 'product_version'
 * @param {number} params.entityId
 * @param {Object|null} params.oldValue
 * @param {Object|null} params.newValue
 * @param {number} params.performedBy - user id
 * @param {Object} [params.client] - pg client for use inside transactions
 */
async function logAudit({ action, entityType, entityId, oldValue = null, newValue = null, performedBy, client }) {
  const query = `
    INSERT INTO audit_logs (action, entity_type, entity_id, old_value, new_value, performed_by)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  const values = [
    action,
    entityType,
    entityId,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    performedBy,
  ];
  await (client || pool).query(query, values);
}

module.exports = { logAudit };
