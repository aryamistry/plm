const pool = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');

/**
 * ============================================================
 * ECOs Service — Central module with core business logic
 * Includes applyECO transactional function
 * ============================================================
 */

async function createEco({ title, type, product_id, bom_id, effective_date, version_update }, userId) {
  // Validate type
  if (!['PRODUCT', 'BOM'].includes(type)) {
    const err = new Error('Type must be PRODUCT or BOM.');
    err.statusCode = 400;
    throw err;
  }

  // Validate product has ACTIVE version
  const productCheck = await pool.query(
    `SELECT pv.id FROM product_versions pv WHERE pv.product_id = $1 AND pv.status = 'ACTIVE' LIMIT 1`,
    [product_id]
  );
  if (productCheck.rows.length === 0) {
    const err = new Error('Product does not have an ACTIVE version or does not exist.');
    err.statusCode = 400;
    throw err;
  }

  // If BOM type, validate bom_id
  if (type === 'BOM') {
    if (!bom_id) {
      const err = new Error('bom_id is required for BOM type ECOs.');
      err.statusCode = 400;
      throw err;
    }
    // Check BOM exists and is linked to the product
    const bomCheck = await pool.query(
      `SELECT b.id FROM boms b
       JOIN bom_versions bv ON bv.bom_id = b.id AND bv.status = 'ACTIVE'
       WHERE b.id = $1 AND b.product_id = $2 LIMIT 1`,
      [bom_id, product_id]
    );
    if (bomCheck.rows.length === 0) {
      const err = new Error('BoM does not exist, is not ACTIVE, or is not linked to the specified product.');
      err.statusCode = 400;
      throw err;
    }
  }

  // Get first stage (lowest sequence)
  const firstStageResult = await pool.query(
    'SELECT * FROM eco_stages ORDER BY sequence ASC LIMIT 1'
  );
  if (firstStageResult.rows.length === 0) {
    const err = new Error('No ECO stages configured. Admin must create at least one stage.');
    err.statusCode = 400;
    throw err;
  }
  const firstStage = firstStageResult.rows[0];

  const result = await pool.query(
    `INSERT INTO ecos (title, type, product_id, bom_id, created_by, effective_date, version_update, stage_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'NEW') RETURNING *`,
    [title, type, product_id, bom_id || null, userId, effective_date || null, version_update !== false, firstStage.id]
  );
  const eco = result.rows[0];

  await logAudit({
    action: 'ECO_CREATED',
    entityType: 'eco',
    entityId: eco.id,
    newValue: eco,
    performedBy: userId,
  });

  return { ...eco, stage: firstStage };
}

async function listEcos({ type, status, product_id, page, limit, offset, roleName }) {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (roleName === 'operations') {
    conditions.push(`e.status = 'DONE'`);
  } else if (status) {
    conditions.push(`e.status = $${paramIdx++}`);
    params.push(status);
  }

  if (type) {
    conditions.push(`e.type = $${paramIdx++}`);
    params.push(type);
  }
  if (product_id) {
    conditions.push(`e.product_id = $${paramIdx++}`);
    params.push(product_id);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM ecos e ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const queryParams = [...params, limit, offset];
  const result = await pool.query(
    `SELECT e.*, es.name AS stage_name, p.name AS product_name, u.name AS created_by_name
     FROM ecos e
     LEFT JOIN eco_stages es ON es.id = e.stage_id
     JOIN products p ON p.id = e.product_id
     JOIN users u ON u.id = e.created_by
     ${whereClause}
     ORDER BY e.id DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    queryParams
  );

  return { ecos: result.rows, total };
}

async function getEcoById(id) {
  const ecoResult = await pool.query(
    `SELECT e.*, es.name AS stage_name, es.sequence AS stage_sequence, es.requires_approval,
            p.name AS product_name, p.product_code, u.name AS created_by_name
     FROM ecos e
     LEFT JOIN eco_stages es ON es.id = e.stage_id
     JOIN products p ON p.id = e.product_id
     JOIN users u ON u.id = e.created_by
     WHERE e.id = $1`,
    [id]
  );
  if (ecoResult.rows.length === 0) {
    const err = new Error('ECO not found.');
    err.statusCode = 404;
    throw err;
  }
  const eco = ecoResult.rows[0];

  // Get proposed changes
  let productChanges = null;
  let bomComponentChanges = [];
  let bomOperationChanges = [];

  if (eco.type === 'PRODUCT') {
    const pcResult = await pool.query('SELECT * FROM eco_product_changes WHERE eco_id = $1', [id]);
    productChanges = pcResult.rows.length > 0 ? pcResult.rows[0] : null;
  } else {
    const bccResult = await pool.query('SELECT * FROM eco_bom_component_changes WHERE eco_id = $1', [id]);
    bomComponentChanges = bccResult.rows;
    const bocResult = await pool.query('SELECT * FROM eco_bom_operation_changes WHERE eco_id = $1', [id]);
    bomOperationChanges = bocResult.rows;
  }

  // Get current approvals
  const approvalsResult = await pool.query(
    `SELECT ea.*, u.name AS approver_name
     FROM eco_approvals ea
     JOIN users u ON u.id = ea.approver_id
     WHERE ea.eco_id = $1`,
    [id]
  );

  return {
    ...eco,
    proposed_changes: eco.type === 'PRODUCT'
      ? { product_changes: productChanges }
      : { component_changes: bomComponentChanges, operation_changes: bomOperationChanges },
    approvals: approvalsResult.rows,
  };
}

async function proposeChanges(ecoId, body, userId) {
  // Fetch ECO
  const ecoResult = await pool.query('SELECT * FROM ecos WHERE id = $1', [ecoId]);
  if (ecoResult.rows.length === 0) {
    const err = new Error('ECO not found.');
    err.statusCode = 404;
    throw err;
  }
  const eco = ecoResult.rows[0];

  if (eco.status !== 'NEW') {
    const err = new Error('Changes can only be proposed when ECO is in NEW status.');
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let result;

    if (eco.type === 'PRODUCT') {
      const { new_sale_price, new_cost_price, new_attachments } = body;
      // Upsert
      await client.query('DELETE FROM eco_product_changes WHERE eco_id = $1', [ecoId]);
      const insertResult = await client.query(
        `INSERT INTO eco_product_changes (eco_id, new_sale_price, new_cost_price, new_attachments)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [ecoId, new_sale_price || null, new_cost_price || null, new_attachments || null]
      );
      result = insertResult.rows[0];
    } else {
      const { component_changes = [], operation_changes = [] } = body;
      // Delete old entries, insert new
      await client.query('DELETE FROM eco_bom_component_changes WHERE eco_id = $1', [ecoId]);
      await client.query('DELETE FROM eco_bom_operation_changes WHERE eco_id = $1', [ecoId]);

      // Validate component_product_ids exist
      for (const cc of component_changes) {
        const check = await client.query('SELECT id FROM products WHERE id = $1', [cc.component_product_id]);
        if (!check.rows.length) {
          const err = new Error(`Component product ${cc.component_product_id} does not exist.`);
          err.statusCode = 400;
          throw err;
        }
      }

      const insertedComponents = [];
      for (const cc of component_changes) {
        const ccResult = await client.query(
          `INSERT INTO eco_bom_component_changes (eco_id, component_product_id, old_quantity, new_quantity)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [ecoId, cc.component_product_id, cc.old_quantity || null, cc.new_quantity || null]
        );
        insertedComponents.push(ccResult.rows[0]);
      }

      const insertedOperations = [];
      for (const oc of operation_changes) {
        const ocResult = await client.query(
          `INSERT INTO eco_bom_operation_changes (eco_id, operation_name, old_time_minutes, new_time_minutes)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [ecoId, oc.operation_name, oc.old_time_minutes || null, oc.new_time_minutes || null]
        );
        insertedOperations.push(ocResult.rows[0]);
      }

      result = { component_changes: insertedComponents, operation_changes: insertedOperations };
    }

    await logAudit({
      action: 'ECO_CHANGES_PROPOSED',
      entityType: 'eco',
      entityId: ecoId,
      newValue: result,
      performedBy: userId,
      client,
    });

    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getEcoDiff(ecoId) {
  const ecoResult = await pool.query('SELECT * FROM ecos WHERE id = $1', [ecoId]);
  if (ecoResult.rows.length === 0) {
    const err = new Error('ECO not found.');
    err.statusCode = 404;
    throw err;
  }
  const eco = ecoResult.rows[0];

  if (eco.type === 'PRODUCT') {
    // Get current ACTIVE product version
    const currentVersion = await pool.query(
      `SELECT * FROM product_versions WHERE product_id = $1 AND status = 'ACTIVE' ORDER BY version DESC LIMIT 1`,
      [eco.product_id]
    );
    const current = currentVersion.rows[0] || {};

    const changesResult = await pool.query('SELECT * FROM eco_product_changes WHERE eco_id = $1', [ecoId]);
    const changes = changesResult.rows[0] || {};

    const diff = [];
    if (changes.new_sale_price !== null && changes.new_sale_price !== undefined) {
      diff.push({ field: 'sale_price', old_value: current.sale_price, new_value: changes.new_sale_price });
    }
    if (changes.new_cost_price !== null && changes.new_cost_price !== undefined) {
      diff.push({ field: 'cost_price', old_value: current.cost_price, new_value: changes.new_cost_price });
    }
    if (changes.new_attachments !== null && changes.new_attachments !== undefined) {
      diff.push({ field: 'attachments', old_value: current.attachments, new_value: changes.new_attachments });
    }

    return { type: 'PRODUCT', diff };
  } else {
    // BOM type
    const activeBomVersion = await pool.query(
      `SELECT bv.* FROM bom_versions bv WHERE bv.bom_id = $1 AND bv.status = 'ACTIVE' ORDER BY version DESC LIMIT 1`,
      [eco.bom_id]
    );
    const currentBomVersion = activeBomVersion.rows[0];

    // Current components
    let currentComponents = [];
    if (currentBomVersion) {
      const compResult = await pool.query(
        `SELECT bc.component_product_id, bc.quantity, p.name AS component_name
         FROM bom_components bc
         JOIN products p ON p.id = bc.component_product_id
         WHERE bc.bom_version_id = $1`,
        [currentBomVersion.id]
      );
      currentComponents = compResult.rows;
    }

    // Proposed changes
    const compChanges = await pool.query('SELECT * FROM eco_bom_component_changes WHERE eco_id = $1', [ecoId]);
    const opChanges = await pool.query('SELECT * FROM eco_bom_operation_changes WHERE eco_id = $1', [ecoId]);

    // Build component diff
    const currentCompMap = new Map();
    for (const c of currentComponents) {
      currentCompMap.set(c.component_product_id, c);
    }

    const componentDiff = compChanges.rows.map(cc => {
      const current = currentCompMap.get(cc.component_product_id);
      let change = 'UNCHANGED';
      const oldQty = cc.old_quantity ? parseFloat(cc.old_quantity) : (current ? parseFloat(current.quantity) : null);
      const newQty = cc.new_quantity ? parseFloat(cc.new_quantity) : null;

      if (oldQty === null && newQty !== null) change = 'ADDED';
      else if (newQty === null || newQty === 0) change = 'REMOVED';
      else if (newQty < oldQty) change = 'REDUCED';
      else if (newQty !== oldQty) change = 'ADDED';

      return {
        component_product_id: cc.component_product_id,
        old_quantity: oldQty,
        new_quantity: newQty,
        change,
      };
    });

    const operationDiff = opChanges.rows.map(oc => ({
      operation_name: oc.operation_name,
      old_time_minutes: oc.old_time_minutes,
      new_time_minutes: oc.new_time_minutes,
    }));

    return { type: 'BOM', component_diff: componentDiff, operation_diff: operationDiff };
  }
}

async function submitEco(ecoId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ecoResult = await client.query('SELECT * FROM ecos WHERE id = $1 FOR UPDATE', [ecoId]);
    if (ecoResult.rows.length === 0) {
      const err = new Error('ECO not found.');
      err.statusCode = 404;
      throw err;
    }
    const eco = ecoResult.rows[0];

    if (eco.status !== 'NEW') {
      const err = new Error('ECO can only be submitted when in NEW status.');
      err.statusCode = 400;
      throw err;
    }

    // Check has at least one proposed change
    let hasChanges = false;
    if (eco.type === 'PRODUCT') {
      const pc = await client.query('SELECT id FROM eco_product_changes WHERE eco_id = $1 LIMIT 1', [ecoId]);
      hasChanges = pc.rows.length > 0;
    } else {
      const bcc = await client.query('SELECT id FROM eco_bom_component_changes WHERE eco_id = $1 LIMIT 1', [ecoId]);
      const boc = await client.query('SELECT id FROM eco_bom_operation_changes WHERE eco_id = $1 LIMIT 1', [ecoId]);
      hasChanges = bcc.rows.length > 0 || boc.rows.length > 0;
    }
    if (!hasChanges) {
      const err = new Error('ECO must have at least one proposed change before submission.');
      err.statusCode = 400;
      throw err;
    }

    // Get current stage and find next stage
    const currentStage = await client.query('SELECT * FROM eco_stages WHERE id = $1', [eco.stage_id]);
    const nextStageResult = await client.query(
      'SELECT * FROM eco_stages WHERE sequence > $1 ORDER BY sequence ASC LIMIT 1',
      [currentStage.rows[0].sequence]
    );

    if (nextStageResult.rows.length === 0) {
      // No next stage — apply directly (within same transaction)
      await client.query(
        `UPDATE ecos SET status = 'IN_PROGRESS' WHERE id = $1`,
        [ecoId]
      );
      await applyEco(ecoId, userId, client);
      await client.query('COMMIT');
      return await getEcoById(ecoId);
    }

    const nextStage = nextStageResult.rows[0];

    if (nextStage.requires_approval) {
      // Create approval records for all approvers
      const approvers = await client.query(
        `SELECT id FROM users WHERE role_id IN (SELECT id FROM roles WHERE name IN ('approver', 'admin'))`
      );
      for (const approver of approvers.rows) {
        await client.query(
          `INSERT INTO eco_approvals (eco_id, approver_id, status) VALUES ($1, $2, 'PENDING')`,
          [ecoId, approver.id]
        );
      }
      await client.query(
        `UPDATE ecos SET stage_id = $1, status = 'IN_PROGRESS' WHERE id = $2`,
        [nextStage.id, ecoId]
      );
    } else {
      // No approval needed, skip to next stage
      await client.query(
        `UPDATE ecos SET stage_id = $1, status = 'IN_PROGRESS' WHERE id = $2`,
        [nextStage.id, ecoId]
      );
    }

    await logAudit({
      action: 'ECO_SUBMITTED',
      entityType: 'eco',
      entityId: ecoId,
      oldValue: { stage_id: eco.stage_id, status: eco.status },
      newValue: { stage_id: nextStage.id, status: 'IN_PROGRESS' },
      performedBy: userId,
      client,
    });

    await client.query('COMMIT');

    const updatedEco = await getEcoById(ecoId);
    return updatedEco;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function validateEco(ecoId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ecoResult = await client.query('SELECT * FROM ecos WHERE id = $1 FOR UPDATE', [ecoId]);
    if (ecoResult.rows.length === 0) {
      const err = new Error('ECO not found.');
      err.statusCode = 404;
      throw err;
    }
    const eco = ecoResult.rows[0];

    // Get current stage
    const currentStageResult = await client.query('SELECT * FROM eco_stages WHERE id = $1', [eco.stage_id]);
    const currentStage = currentStageResult.rows[0];

    if (currentStage.requires_approval) {
      const err = new Error('This stage requires approval. Use the approval workflow instead.');
      err.statusCode = 400;
      throw err;
    }

    // Find next stage
    const nextStageResult = await client.query(
      'SELECT * FROM eco_stages WHERE sequence > $1 ORDER BY sequence ASC LIMIT 1',
      [currentStage.sequence]
    );

    if (nextStageResult.rows.length === 0) {
      // Final stage — apply ECO within same transaction
      await logAudit({
        action: 'ECO_VALIDATED',
        entityType: 'eco',
        entityId: ecoId,
        performedBy: userId,
        client,
      });
      await applyEco(ecoId, userId, client);
      await client.query('COMMIT');
      return await getEcoById(ecoId);
    }

    const nextStage = nextStageResult.rows[0];

    if (nextStage.requires_approval) {
      // Create approval records for all approvers and admins
      const approvers = await client.query(
        `SELECT id FROM users WHERE role_id IN (SELECT id FROM roles WHERE name IN ('approver', 'admin'))`
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

    await logAudit({
      action: 'ECO_VALIDATED',
      entityType: 'eco',
      entityId: ecoId,
      oldValue: { stage_id: eco.stage_id },
      newValue: { stage_id: nextStage.id },
      performedBy: userId,
      client,
    });

    await client.query('COMMIT');

    const updatedEco = await getEcoById(ecoId);
    return updatedEco;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteEco(ecoId, userId) {
  const ecoResult = await pool.query('SELECT * FROM ecos WHERE id = $1', [ecoId]);
  if (ecoResult.rows.length === 0) {
    const err = new Error('ECO not found.');
    err.statusCode = 404;
    throw err;
  }
  const eco = ecoResult.rows[0];

  if (eco.status !== 'NEW') {
    const err = new Error('ECO can only be deleted when in NEW status.');
    err.statusCode = 400;
    throw err;
  }

  await pool.query('DELETE FROM ecos WHERE id = $1', [ecoId]);

  await logAudit({
    action: 'ECO_DELETED',
    entityType: 'eco',
    entityId: ecoId,
    oldValue: eco,
    performedBy: userId,
  });

  return { message: 'ECO deleted successfully.' };
}

/**
 * ============================================================
 * applyECO — The heart of the system
 * Accepts an optional existingClient for transaction safety.
 * If no client is provided, manages its own transaction.
 * ============================================================
 */
async function applyEco(ecoId, userId, existingClient = null) {
  const client = existingClient || await pool.connect();
  const shouldManageTransaction = !existingClient;
  try {
    if (shouldManageTransaction) await client.query('BEGIN');

    // 1. Fetch the ECO with all proposed changes
    const ecoResult = await client.query('SELECT * FROM ecos WHERE id = $1 FOR UPDATE', [ecoId]);
    if (ecoResult.rows.length === 0) {
      throw new Error('ECO not found for application.');
    }
    const eco = ecoResult.rows[0];

    if (eco.type === 'PRODUCT') {
      // 2. Fetch current ACTIVE product_version
      const currentVersionResult = await client.query(
        `SELECT * FROM product_versions WHERE product_id = $1 AND status = 'ACTIVE' ORDER BY version DESC LIMIT 1`,
        [eco.product_id]
      );
      if (currentVersionResult.rows.length === 0) {
        throw new Error('No ACTIVE product version found.');
      }
      const currentVersion = currentVersionResult.rows[0];

      // Get proposed changes
      const changesResult = await client.query(
        'SELECT * FROM eco_product_changes WHERE eco_id = $1',
        [ecoId]
      );
      const changes = changesResult.rows[0] || {};

      if (eco.version_update) {
        // Create new version, archive old
        const newVersion = currentVersion.version + 1;
        const newSalePrice = changes.new_sale_price !== null && changes.new_sale_price !== undefined
          ? changes.new_sale_price : currentVersion.sale_price;
        const newCostPrice = changes.new_cost_price !== null && changes.new_cost_price !== undefined
          ? changes.new_cost_price : currentVersion.cost_price;
        const newAttachments = changes.new_attachments !== null && changes.new_attachments !== undefined
          ? changes.new_attachments : currentVersion.attachments;

        const newVersionResult = await client.query(
          `INSERT INTO product_versions (product_id, version, sale_price, cost_price, attachments, status)
           VALUES ($1, $2, $3, $4, $5, 'ACTIVE') RETURNING *`,
          [eco.product_id, newVersion, newSalePrice, newCostPrice, newAttachments]
        );

        // Archive old version
        await client.query(
          `UPDATE product_versions SET status = 'ARCHIVED' WHERE id = $1`,
          [currentVersion.id]
        );

        await logAudit({
          action: 'PRODUCT_VERSION_CREATED',
          entityType: 'product_version',
          entityId: newVersionResult.rows[0].id,
          oldValue: currentVersion,
          newValue: newVersionResult.rows[0],
          performedBy: userId,
          client,
        });
      } else {
        // In-place update
        const oldVersion = { ...currentVersion };
        const updateFields = [];
        const updateValues = [];
        let idx = 1;

        if (changes.new_sale_price !== null && changes.new_sale_price !== undefined) {
          updateFields.push(`sale_price = $${idx++}`);
          updateValues.push(changes.new_sale_price);
        }
        if (changes.new_cost_price !== null && changes.new_cost_price !== undefined) {
          updateFields.push(`cost_price = $${idx++}`);
          updateValues.push(changes.new_cost_price);
        }
        if (changes.new_attachments !== null && changes.new_attachments !== undefined) {
          updateFields.push(`attachments = $${idx++}`);
          updateValues.push(changes.new_attachments);
        }

        if (updateFields.length > 0) {
          updateValues.push(currentVersion.id);
          await client.query(
            `UPDATE product_versions SET ${updateFields.join(', ')} WHERE id = $${idx}`,
            updateValues
          );
        }

        const updatedVersionResult = await client.query(
          'SELECT * FROM product_versions WHERE id = $1',
          [currentVersion.id]
        );

        await logAudit({
          action: 'PRODUCT_VERSION_UPDATED',
          entityType: 'product_version',
          entityId: currentVersion.id,
          oldValue: oldVersion,
          newValue: updatedVersionResult.rows[0],
          performedBy: userId,
          client,
        });
      }
    } else if (eco.type === 'BOM') {
      // 3. Fetch current ACTIVE bom_version
      const currentBomVersionResult = await client.query(
        `SELECT * FROM bom_versions WHERE bom_id = $1 AND status = 'ACTIVE' ORDER BY version DESC LIMIT 1`,
        [eco.bom_id]
      );
      if (currentBomVersionResult.rows.length === 0) {
        throw new Error('No ACTIVE BoM version found.');
      }
      const currentBomVersion = currentBomVersionResult.rows[0];

      // Fetch current components and operations
      const currentComponents = await client.query(
        'SELECT * FROM bom_components WHERE bom_version_id = $1',
        [currentBomVersion.id]
      );
      const currentOperations = await client.query(
        'SELECT * FROM bom_operations WHERE bom_version_id = $1',
        [currentBomVersion.id]
      );

      // Get proposed changes
      const compChanges = await client.query(
        'SELECT * FROM eco_bom_component_changes WHERE eco_id = $1',
        [ecoId]
      );
      const opChanges = await client.query(
        'SELECT * FROM eco_bom_operation_changes WHERE eco_id = $1',
        [ecoId]
      );

      if (eco.version_update) {
        // Create new bom_version
        const newVersion = currentBomVersion.version + 1;
        const newBomVersionResult = await client.query(
          `INSERT INTO bom_versions (bom_id, version, status) VALUES ($1, $2, 'ACTIVE') RETURNING *`,
          [eco.bom_id, newVersion]
        );
        const newBomVersionId = newBomVersionResult.rows[0].id;

        // Build change maps
        const compChangeMap = new Map();
        for (const cc of compChanges.rows) {
          compChangeMap.set(cc.component_product_id, cc);
        }

        // Copy components, applying changes
        for (const comp of currentComponents.rows) {
          const change = compChangeMap.get(comp.component_product_id);
          const quantity = change && change.new_quantity !== null ? change.new_quantity : comp.quantity;
          // If quantity is 0 or null in change (REMOVED), skip
          if (change && (change.new_quantity === null || parseFloat(change.new_quantity) === 0)) {
            continue; // Component removed
          }
          await client.query(
            `INSERT INTO bom_components (bom_version_id, component_product_id, quantity)
             VALUES ($1, $2, $3)`,
            [newBomVersionId, comp.component_product_id, quantity]
          );
          compChangeMap.delete(comp.component_product_id);
        }

        // Add new components (those in changes but not in current)
        for (const [cpId, change] of compChangeMap) {
          if (change.new_quantity && parseFloat(change.new_quantity) > 0) {
            await client.query(
              `INSERT INTO bom_components (bom_version_id, component_product_id, quantity)
               VALUES ($1, $2, $3)`,
              [newBomVersionId, cpId, change.new_quantity]
            );
          }
        }

        // Copy operations, applying changes
        const opChangeMap = new Map();
        for (const oc of opChanges.rows) {
          opChangeMap.set(oc.operation_name, oc);
        }

        for (const op of currentOperations.rows) {
          const change = opChangeMap.get(op.operation_name);
          const time_minutes = change && change.new_time_minutes !== null ? change.new_time_minutes : op.time_minutes;
          await client.query(
            `INSERT INTO bom_operations (bom_version_id, operation_name, time_minutes, work_center)
             VALUES ($1, $2, $3, $4)`,
            [newBomVersionId, op.operation_name, time_minutes, op.work_center]
          );
          opChangeMap.delete(op.operation_name);
        }

        // Add new operations
        for (const [opName, change] of opChangeMap) {
          await client.query(
            `INSERT INTO bom_operations (bom_version_id, operation_name, time_minutes, work_center)
             VALUES ($1, $2, $3, $4)`,
            [newBomVersionId, opName, change.new_time_minutes, null]
          );
        }

        // Archive old version
        await client.query(
          `UPDATE bom_versions SET status = 'ARCHIVED' WHERE id = $1`,
          [currentBomVersion.id]
        );

        await logAudit({
          action: 'BOM_VERSION_CREATED',
          entityType: 'bom_version',
          entityId: newBomVersionId,
          oldValue: { version: currentBomVersion, components: currentComponents.rows, operations: currentOperations.rows },
          newValue: { version: newBomVersionResult.rows[0] },
          performedBy: userId,
          client,
        });
      } else {
        // In-place update
        for (const cc of compChanges.rows) {
          if (cc.new_quantity === null || parseFloat(cc.new_quantity) === 0) {
            // Remove component
            await client.query(
              `DELETE FROM bom_components WHERE bom_version_id = $1 AND component_product_id = $2`,
              [currentBomVersion.id, cc.component_product_id]
            );
          } else {
            // Check if component exists
            const existing = await client.query(
              `SELECT id FROM bom_components WHERE bom_version_id = $1 AND component_product_id = $2`,
              [currentBomVersion.id, cc.component_product_id]
            );
            if (existing.rows.length > 0) {
              await client.query(
                `UPDATE bom_components SET quantity = $1 WHERE bom_version_id = $2 AND component_product_id = $3`,
                [cc.new_quantity, currentBomVersion.id, cc.component_product_id]
              );
            } else {
              await client.query(
                `INSERT INTO bom_components (bom_version_id, component_product_id, quantity) VALUES ($1, $2, $3)`,
                [currentBomVersion.id, cc.component_product_id, cc.new_quantity]
              );
            }
          }
        }

        for (const oc of opChanges.rows) {
          const existing = await client.query(
            `SELECT id FROM bom_operations WHERE bom_version_id = $1 AND operation_name = $2`,
            [currentBomVersion.id, oc.operation_name]
          );
          if (existing.rows.length > 0) {
            await client.query(
              `UPDATE bom_operations SET time_minutes = $1 WHERE bom_version_id = $2 AND operation_name = $3`,
              [oc.new_time_minutes, currentBomVersion.id, oc.operation_name]
            );
          } else {
            await client.query(
              `INSERT INTO bom_operations (bom_version_id, operation_name, time_minutes) VALUES ($1, $2, $3)`,
              [currentBomVersion.id, oc.operation_name, oc.new_time_minutes]
            );
          }
        }

        await logAudit({
          action: 'BOM_VERSION_UPDATED',
          entityType: 'bom_version',
          entityId: currentBomVersion.id,
          oldValue: { components: currentComponents.rows, operations: currentOperations.rows },
          performedBy: userId,
          client,
        });
      }
    }

    // 4. Set ECO status = 'DONE'
    // 5. Set ECO stage to the final stage
    const finalStageResult = await client.query(
      'SELECT * FROM eco_stages ORDER BY sequence DESC LIMIT 1'
    );
    const finalStage = finalStageResult.rows[0];

    await client.query(
      `UPDATE ecos SET status = 'DONE', stage_id = $1 WHERE id = $2`,
      [finalStage ? finalStage.id : eco.stage_id, ecoId]
    );

    if (shouldManageTransaction) await client.query('COMMIT');
  } catch (err) {
    if (shouldManageTransaction) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (shouldManageTransaction) client.release();
  }
}

module.exports = {
  createEco,
  listEcos,
  getEcoById,
  proposeChanges,
  getEcoDiff,
  submitEco,
  validateEco,
  deleteEco,
  applyEco,
};
