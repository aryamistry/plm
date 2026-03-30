const pool = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');

async function createBom({ product_id, components = [], operations = [] }, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate product has an ACTIVE version
    const productCheck = await client.query(
      `SELECT pv.id FROM product_versions pv WHERE pv.product_id = $1 AND pv.status = 'ACTIVE' LIMIT 1`,
      [product_id]
    );
    if (productCheck.rows.length === 0) {
      const err = new Error('Product does not have an ACTIVE version or does not exist.');
      err.statusCode = 400;
      throw err;
    }

    // Validate each component_product_id has an ACTIVE version
    for (const comp of components) {
      const compCheck = await client.query(
        `SELECT pv.id FROM product_versions pv WHERE pv.product_id = $1 AND pv.status = 'ACTIVE' LIMIT 1`,
        [comp.component_product_id]
      );
      if (compCheck.rows.length === 0) {
        const err = new Error(`Component product ${comp.component_product_id} is not ACTIVE or does not exist.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Insert BOM
    const bomResult = await client.query(
      'INSERT INTO boms (product_id) VALUES ($1) RETURNING *',
      [product_id]
    );
    const bom = bomResult.rows[0];

    // Insert BOM version
    const bomVersionResult = await client.query(
      `INSERT INTO bom_versions (bom_id, version, status) VALUES ($1, 1, 'ACTIVE') RETURNING *`,
      [bom.id]
    );
    const bomVersion = bomVersionResult.rows[0];

    // Insert components
    const insertedComponents = [];
    for (const comp of components) {
      const compResult = await client.query(
        `INSERT INTO bom_components (bom_version_id, component_product_id, quantity)
         VALUES ($1, $2, $3) RETURNING *`,
        [bomVersion.id, comp.component_product_id, comp.quantity]
      );
      insertedComponents.push(compResult.rows[0]);
    }

    // Insert operations
    const insertedOperations = [];
    for (const op of operations) {
      const opResult = await client.query(
        `INSERT INTO bom_operations (bom_version_id, operation_name, time_minutes, work_center)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [bomVersion.id, op.operation_name, op.time_minutes, op.work_center]
      );
      insertedOperations.push(opResult.rows[0]);
    }

    await logAudit({
      action: 'BOM_CREATED',
      entityType: 'bom',
      entityId: bom.id,
      newValue: { bom, version: bomVersion, components: insertedComponents, operations: insertedOperations },
      performedBy: userId,
      client,
    });

    await client.query('COMMIT');

    return {
      ...bom,
      current_version: {
        ...bomVersion,
        components: insertedComponents,
        operations: insertedOperations,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listBoms({ product_id, status, page, limit, offset, roleName }) {
  let statusFilter = status;
  if (roleName === 'operations') {
    statusFilter = 'ACTIVE';
  }

  const params = [];
  const conditions = [];
  let paramIdx = 1;

  if (product_id) {
    conditions.push(`b.product_id = $${paramIdx++}`);
    params.push(product_id);
  }
  if (statusFilter) {
    conditions.push(`bv.status = $${paramIdx++}`);
    params.push(statusFilter);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRes = await pool.query(
    `SELECT COUNT(DISTINCT b.id) FROM boms b
     JOIN bom_versions bv ON bv.bom_id = b.id
     ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const queryParams = [...params, limit, offset];
  const result = await pool.query(
    `SELECT b.id, b.product_id, b.created_at, p.name AS product_name,
            (SELECT COUNT(*) FROM bom_versions bv2 WHERE bv2.bom_id = b.id) AS version_count
     FROM boms b
     JOIN products p ON p.id = b.product_id
     JOIN bom_versions bv ON bv.bom_id = b.id
     ${whereClause}
     GROUP BY b.id, p.name, bv.status
     ORDER BY b.id ASC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    queryParams
  );

  return { boms: result.rows, total };
}

async function getBomById(id) {
  const bomResult = await pool.query(
    `SELECT b.*, p.name AS product_name FROM boms b
     JOIN products p ON p.id = b.product_id
     WHERE b.id = $1`,
    [id]
  );
  if (bomResult.rows.length === 0) {
    const err = new Error('BoM not found.');
    err.statusCode = 404;
    throw err;
  }
  const bom = bomResult.rows[0];

  const versionsResult = await pool.query(
    'SELECT * FROM bom_versions WHERE bom_id = $1 ORDER BY version DESC',
    [id]
  );

  // Get components and operations for the active version
  const activeVersion = versionsResult.rows.find(v => v.status === 'ACTIVE');
  let components = [];
  let operations = [];

  if (activeVersion) {
    const compResult = await pool.query(
      `SELECT bc.*, p.name AS component_name
       FROM bom_components bc
       JOIN products p ON p.id = bc.component_product_id
       WHERE bc.bom_version_id = $1`,
      [activeVersion.id]
    );
    components = compResult.rows;

    const opsResult = await pool.query(
      'SELECT * FROM bom_operations WHERE bom_version_id = $1',
      [activeVersion.id]
    );
    operations = opsResult.rows;
  }

  return {
    ...bom,
    versions: versionsResult.rows,
    active_version: activeVersion ? { ...activeVersion, components, operations } : null,
  };
}

async function getBomVersions(bomId) {
  const bomResult = await pool.query('SELECT id FROM boms WHERE id = $1', [bomId]);
  if (bomResult.rows.length === 0) {
    const err = new Error('BoM not found.');
    err.statusCode = 404;
    throw err;
  }

  const versionsResult = await pool.query(
    'SELECT * FROM bom_versions WHERE bom_id = $1 ORDER BY version DESC',
    [bomId]
  );

  const versionsWithDetails = [];
  for (const version of versionsResult.rows) {
    const compResult = await pool.query(
      `SELECT bc.*, p.name AS component_name
       FROM bom_components bc
       JOIN products p ON p.id = bc.component_product_id
       WHERE bc.bom_version_id = $1`,
      [version.id]
    );
    const opsResult = await pool.query(
      'SELECT * FROM bom_operations WHERE bom_version_id = $1',
      [version.id]
    );
    versionsWithDetails.push({
      ...version,
      components: compResult.rows,
      operations: opsResult.rows,
    });
  }

  return versionsWithDetails;
}

async function diffBomVersions(bomId, versionId1, versionId2) {
  // Get components for both versions
  const comp1Result = await pool.query(
    `SELECT bc.component_product_id, bc.quantity, p.name AS component_name
     FROM bom_components bc
     JOIN products p ON p.id = bc.component_product_id
     WHERE bc.bom_version_id = $1`,
    [versionId1]
  );
  const comp2Result = await pool.query(
    `SELECT bc.component_product_id, bc.quantity, p.name AS component_name
     FROM bom_components bc
     JOIN products p ON p.id = bc.component_product_id
     WHERE bc.bom_version_id = $1`,
    [versionId2]
  );

  // Build maps
  const comp1Map = new Map();
  for (const c of comp1Result.rows) {
    comp1Map.set(c.component_product_id, c);
  }
  const comp2Map = new Map();
  for (const c of comp2Result.rows) {
    comp2Map.set(c.component_product_id, c);
  }

  const componentDiff = [];
  const allComponentIds = new Set([...comp1Map.keys(), ...comp2Map.keys()]);
  for (const cpId of allComponentIds) {
    const old = comp1Map.get(cpId);
    const newer = comp2Map.get(cpId);

    let change = 'UNCHANGED';
    const oldQty = old ? parseFloat(old.quantity) : null;
    const newQty = newer ? parseFloat(newer.quantity) : null;

    if (!old && newer) change = 'ADDED';
    else if (old && !newer) change = 'REMOVED';
    else if (oldQty !== newQty) change = newQty < oldQty ? 'REDUCED' : 'ADDED';

    componentDiff.push({
      component_product_id: cpId,
      component_name: (old || newer).component_name,
      old_quantity: oldQty,
      new_quantity: newQty,
      change,
    });
  }

  // Operation diff
  const ops1Result = await pool.query(
    'SELECT * FROM bom_operations WHERE bom_version_id = $1',
    [versionId1]
  );
  const ops2Result = await pool.query(
    'SELECT * FROM bom_operations WHERE bom_version_id = $1',
    [versionId2]
  );

  const ops1Map = new Map();
  for (const o of ops1Result.rows) ops1Map.set(o.operation_name, o);
  const ops2Map = new Map();
  for (const o of ops2Result.rows) ops2Map.set(o.operation_name, o);

  const operationDiff = [];
  const allOpNames = new Set([...ops1Map.keys(), ...ops2Map.keys()]);
  for (const name of allOpNames) {
    const old = ops1Map.get(name);
    const newer = ops2Map.get(name);
    operationDiff.push({
      operation_name: name,
      old_time_minutes: old ? old.time_minutes : null,
      new_time_minutes: newer ? newer.time_minutes : null,
    });
  }

  return { component_diff: componentDiff, operation_diff: operationDiff };
}

module.exports = { createBom, listBoms, getBomById, getBomVersions, diffBomVersions };
