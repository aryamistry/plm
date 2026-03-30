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

  const result = await pool.query(
    `SELECT e.id AS eco_id, e.title, e.type, p.name AS product_name,
            e.status, es.name AS stage_name, e.created_at
     FROM ecos e
     JOIN products p ON p.id = e.product_id
     LEFT JOIN eco_stages es ON es.id = e.stage_id
     ${whereClause}
     ORDER BY e.id DESC`,
    params
  );

  // Generate changes_summary for each ECO
  const ecos = [];
  for (const row of result.rows) {
    let changes_summary = 'No changes';

    if (row.type === 'PRODUCT') {
      const pc = await pool.query('SELECT * FROM eco_product_changes WHERE eco_id = $1', [row.eco_id]);
      if (pc.rows.length > 0) {
        const c = pc.rows[0];
        const parts = [];
        if (c.new_sale_price !== null) parts.push(`Sale price → ${c.new_sale_price}`);
        if (c.new_cost_price !== null) parts.push(`Cost price → ${c.new_cost_price}`);
        changes_summary = parts.length > 0 ? parts.join(', ') : 'No changes';
      }
    } else {
      const bcc = await pool.query('SELECT * FROM eco_bom_component_changes WHERE eco_id = $1 LIMIT 3', [row.eco_id]);
      if (bcc.rows.length > 0) {
        const parts = bcc.rows.map(c => {
          const oldQ = c.old_quantity || 0;
          const newQ = c.new_quantity || 0;
          return `Component ${c.component_product_id}: ${oldQ} → ${newQ}`;
        });
        changes_summary = parts.join('; ');
      }
    }

    ecos.push({ ...row, changes_summary });
  }

  return ecos;
}

async function getEcoChanges(ecoId) {
  // Delegates to the same logic as ECO diff
  const ecosService = require('../ecos/ecos.service');
  return ecosService.getEcoDiff(ecoId);
}

async function getProductVersionHistory() {
  const result = await pool.query(
    `SELECT p.id, p.name, pv.version, pv.sale_price, pv.cost_price,
            pv.status, pv.created_at
     FROM products p
     JOIN product_versions pv ON pv.product_id = p.id
     ORDER BY p.id ASC, pv.version DESC`
  );
  return result.rows;
}

async function getBomChangeHistory() {
  const result = await pool.query(
    `SELECT b.id AS bom_id, p.name AS product_name, bv.version, bv.status, bv.created_at
     FROM boms b
     JOIN products p ON p.id = b.product_id
     JOIN bom_versions bv ON bv.bom_id = b.id
     ORDER BY b.id ASC, bv.version DESC`
  );

  const boms = [];
  const bomMap = new Map();

  for (const row of result.rows) {
    if (!bomMap.has(row.bom_id)) {
      const bom = { bom_id: row.bom_id, product_name: row.product_name, versions: [] };
      bomMap.set(row.bom_id, bom);
      boms.push(bom);
    }

    const compResult = await pool.query(
      `SELECT bc.*, p2.name AS component_name
       FROM bom_components bc
       JOIN products p2 ON p2.id = bc.component_product_id
       JOIN bom_versions bv ON bv.id = bc.bom_version_id
       WHERE bv.bom_id = $1 AND bv.version = $2`,
      [row.bom_id, row.version]
    );
    const opsResult = await pool.query(
      `SELECT bo.*
       FROM bom_operations bo
       JOIN bom_versions bv ON bv.id = bo.bom_version_id
       WHERE bv.bom_id = $1 AND bv.version = $2`,
      [row.bom_id, row.version]
    );

    bomMap.get(row.bom_id).versions.push({
      version: row.version,
      status: row.status,
      created_at: row.created_at,
      components: compResult.rows,
      operations: opsResult.rows,
    });
  }

  return boms;
}

async function getArchivedProducts() {
  const result = await pool.query(
    `SELECT p.id AS product_id, p.name AS product_name,
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
    `SELECT p.id AS product_id, p.name AS product_name,
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
