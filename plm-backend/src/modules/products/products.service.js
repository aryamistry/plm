const pool = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');

async function createProduct({ product_code, name, sale_price, cost_price, attachments }, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const productResult = await client.query(
      `INSERT INTO products (product_code, name, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [product_code, name, userId]
    );
    const product = productResult.rows[0];

    const versionResult = await client.query(
      `INSERT INTO product_versions (product_id, version, sale_price, cost_price, attachments, status)
       VALUES ($1, 1, $2, $3, $4, 'ACTIVE') RETURNING *`,
      [product.id, sale_price || null, cost_price || null, attachments || null]
    );
    const version = versionResult.rows[0];

    await logAudit({
      action: 'PRODUCT_CREATED',
      entityType: 'product',
      entityId: product.id,
      newValue: { product, version },
      performedBy: userId,
      client,
    });

    await client.query('COMMIT');
    return { ...product, current_version: version };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listProducts({ status, search, page, limit, offset, roleName }) {
  let statusFilter = status;
  if (roleName === 'operations') {
    statusFilter = 'ACTIVE';
  }

  const params = [];
  const conditions = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`(p.name ILIKE $${paramIdx} OR p.product_code ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const searchWhere = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const query = `
    SELECT p.id, p.product_code, p.name, p.created_by, p.created_at,
           pv.id AS version_id, pv.version, pv.sale_price, pv.cost_price,
           pv.attachments, pv.status AS version_status, pv.created_at AS version_created_at
    FROM products p
    JOIN LATERAL (
      SELECT * FROM product_versions pv2
      WHERE pv2.product_id = p.id
      ${statusFilter ? `AND pv2.status = $${paramIdx++}` : ''}
      ORDER BY pv2.version DESC LIMIT 1
    ) pv ON true
    ${searchWhere}
    ORDER BY p.id ASC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  if (statusFilter) params.push(statusFilter);
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Count
  const countParams = [];
  const countConditions = [];
  let cidx = 1;
  if (statusFilter) {
    countConditions.push(`pv.status = $${cidx++}`);
    countParams.push(statusFilter);
  }
  if (search) {
    countConditions.push(`(p.name ILIKE $${cidx} OR p.product_code ILIKE $${cidx})`);
    countParams.push(`%${search}%`);
    cidx++;
  }
  const countWhere = countConditions.length > 0 ? 'WHERE ' + countConditions.join(' AND ') : '';
  const countRes = await pool.query(
    `SELECT COUNT(DISTINCT p.id) FROM products p
     JOIN product_versions pv ON pv.product_id = p.id
     ${countWhere}`,
    countParams
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const products = result.rows.map(row => ({
    id: row.id,
    product_code: row.product_code,
    name: row.name,
    created_by: row.created_by,
    created_at: row.created_at,
    current_version: {
      id: row.version_id,
      version: row.version,
      sale_price: row.sale_price,
      cost_price: row.cost_price,
      attachments: row.attachments,
      status: row.version_status,
      created_at: row.version_created_at,
    },
  }));

  return { products, total };
}

async function getProductById(id) {
  const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  if (productResult.rows.length === 0) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }
  const product = productResult.rows[0];

  const versionsResult = await pool.query(
    'SELECT * FROM product_versions WHERE product_id = $1 ORDER BY version DESC',
    [id]
  );

  const bomsResult = await pool.query(
    `SELECT b.id, b.product_id, b.created_at,
            bv.version, bv.status
     FROM boms b
     JOIN LATERAL (
       SELECT * FROM bom_versions bv2 WHERE bv2.bom_id = b.id ORDER BY bv2.version DESC LIMIT 1
     ) bv ON true
     WHERE b.product_id = $1`,
    [id]
  );

  return {
    ...product,
    versions: versionsResult.rows,
    boms: bomsResult.rows,
  };
}

async function getProductVersions(productId) {
  const productResult = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
  if (productResult.rows.length === 0) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }

  const result = await pool.query(
    'SELECT * FROM product_versions WHERE product_id = $1 ORDER BY version DESC',
    [productId]
  );
  return result.rows;
}

async function directEdit(productId) {
  const err = new Error('Direct edits not permitted. Use an ECO to modify this product.');
  err.statusCode = 403;
  throw err;
}

async function archiveProduct(productId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const productResult = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    const oldVersions = await client.query(
      'SELECT * FROM product_versions WHERE product_id = $1',
      [productId]
    );

    await client.query(
      `UPDATE product_versions SET status = 'ARCHIVED' WHERE product_id = $1`,
      [productId]
    );

    await logAudit({
      action: 'PRODUCT_ARCHIVED',
      entityType: 'product',
      entityId: productId,
      oldValue: { versions: oldVersions.rows },
      newValue: { status: 'ARCHIVED' },
      performedBy: userId,
      client,
    });

    await client.query('COMMIT');
    return { message: 'Product archived successfully.' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createProduct, listProducts, getProductById, getProductVersions, directEdit, archiveProduct };
