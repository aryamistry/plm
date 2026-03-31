const pool = require('../../config/db');

async function getEcosReport({ type, status, from, to }) {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (type) { conditions.push(`e.type = $${paramIdx++}`); params.push(type); }
  if (status) { conditions.push(`e.status = $${paramIdx++}`); params.push(status); }
  if (from) { conditions.push(`e.created_at >= $${paramIdx++}`); params.push(from); }
  if (to) { conditions.push(`e.created_at <= $${paramIdx++}`); params.push(to); }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  // Single query with LEFT JOINs — no N+1
  const result = await pool.query(
    `SELECT e.id AS eco_id, e.title, e.type, p.name AS product_name, p.product_code,
            e.status, es.name AS stage_name, e.created_at,
            pc.new_sale_price, pc.new_cost_price,
            COUNT(bcc.id) AS component_change_count
     FROM ecos e
     JOIN products p ON p.id = e.product_id
     LEFT JOIN eco_stages es ON es.id = e.stage_id
     LEFT JOIN eco_product_changes pc ON pc.eco_id = e.id
     LEFT JOIN eco_bom_component_changes bcc ON bcc.eco_id = e.id
     ${whereClause}
     GROUP BY e.id, p.name, p.product_code, es.name, pc.new_sale_price, pc.new_cost_price
     ORDER BY e.id DESC`,
    params
  );

  const ecos = result.rows.map(row => {
    let changes_summary = 'No changes';
    if (row.type === 'PRODUCT') {
      const parts = [];
      if (row.new_sale_price !== null) parts.push(`Sale price → ${row.new_sale_price}`);
      if (row.new_cost_price !== null) parts.push(`Cost price → ${row.new_cost_price}`);
      changes_summary = parts.length > 0 ? parts.join(', ') : 'No changes';
    } else {
      const count = parseInt(row.component_change_count, 10);
      changes_summary = count > 0 ? `${count} component change(s)` : 'No changes';
    }
    return { ...row, changes_summary };
  });

  return ecos;
}

async function getEcoChanges(ecoId) {
  const ecosService = require('../ecos/ecos.service');
  return ecosService.getEcoDiff(ecoId);
}

async function getProductVersionHistory() {
  const result = await pool.query(
    `SELECT p.id, p.product_code, p.name, pv.version, pv.sale_price, pv.cost_price,
            pv.status, pv.created_at
     FROM products p
     JOIN product_versions pv ON pv.product_id = p.id
     ORDER BY p.id ASC, pv.version DESC`
  );
  return result.rows;
}

async function getBomChangeHistory() {
  // Single query with aggregation — no N+1
  const result = await pool.query(`
    SELECT
      b.id AS bom_id,
      p.name AS product_name,
      bv.id AS version_id,
      bv.version,
      bv.status,
      bv.created_at,
      json_agg(DISTINCT jsonb_build_object(
        'component_product_id', bc.component_product_id,
        'quantity', bc.quantity,
        'component_name', cp.name
      )) FILTER (WHERE bc.id IS NOT NULL) AS components,
      json_agg(DISTINCT jsonb_build_object(
        'operation_name', bo.operation_name,
        'time_minutes', bo.time_minutes,
        'work_center', bo.work_center
      )) FILTER (WHERE bo.id IS NOT NULL) AS operations
    FROM boms b
    JOIN products p ON p.id = b.product_id
    JOIN bom_versions bv ON bv.bom_id = b.id
    LEFT JOIN bom_components bc ON bc.bom_version_id = bv.id
    LEFT JOIN products cp ON cp.id = bc.component_product_id
    LEFT JOIN bom_operations bo ON bo.bom_version_id = bv.id
    GROUP BY b.id, p.name, bv.id
    ORDER BY b.id ASC, bv.version DESC
  `);

  // Group by bom_id
  const boms = [];
  const bomMap = new Map();
  for (const row of result.rows) {
    if (!bomMap.has(row.bom_id)) {
      const bom = { bom_id: row.bom_id, product_name: row.product_name, versions: [] };
      bomMap.set(row.bom_id, bom);
      boms.push(bom);
    }
    bomMap.get(row.bom_id).versions.push({
      version: row.version,
      status: row.status,
      created_at: row.created_at,
      components: row.components || [],
      operations: row.operations || [],
    });
  }
  return boms;
}

async function getArchivedProducts() {
  const result = await pool.query(
    `SELECT p.id AS product_id, p.product_code, p.name AS product_name,
            pv.id AS version_id, pv.version, pv.sale_price, pv.cost_price,
            pv.attachments, pv.status, pv.created_at
     FROM product_versions pv
     JOIN products p ON p.id = pv.product_id
     WHERE pv.status = 'ARCHIVED'
     ORDER BY p.id ASC, pv.version DESC`
  );
  return result.rows;
}

async function getActiveMatrix() {
  const result = await pool.query(
    `SELECT p.id AS product_id, p.product_code, p.name AS product_name,
            pv.version, pv.sale_price, pv.cost_price,
            b.id AS bom_id, bv.version AS bom_version
     FROM products p
     JOIN product_versions pv ON pv.product_id = p.id AND pv.status = 'ACTIVE'
     LEFT JOIN boms b ON b.product_id = p.id
     LEFT JOIN bom_versions bv ON bv.bom_id = b.id AND bv.status = 'ACTIVE'
     ORDER BY p.id ASC`
  );

  const matrix = [];
  const seen = new Set();
  for (const row of result.rows) {
    const key = `${row.product_id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    matrix.push({
      product_id: row.product_id,
      product_code: row.product_code,
      product_name: row.product_name,
      active_version: {
        version: row.version,
        sale_price: row.sale_price,
        cost_price: row.cost_price,
      },
      active_bom: row.bom_id ? {
        bom_id: row.bom_id,
        bom_version: row.bom_version,
      } : null,
    });
  }

  return matrix;
}

module.exports = {
  getEcosReport,
  getEcoChanges,
  getProductVersionHistory,
  getBomChangeHistory,
  getArchivedProducts,
  getActiveMatrix,
};
