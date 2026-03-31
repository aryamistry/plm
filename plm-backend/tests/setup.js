/**
 * Test setup helper — provides reusable functions for integration tests.
 * Tests require a running PostgreSQL database.
 * Set DATABASE_URL in .env to point to a test database.
 */
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const pool = require('../src/config/db');

// Helper: clean all tables (order matters due to foreign keys)
async function cleanDatabase() {
  await pool.query(`
    DELETE FROM audit_logs;
    DELETE FROM eco_approvals;
    DELETE FROM eco_product_changes;
    DELETE FROM eco_bom_component_changes;
    DELETE FROM eco_bom_operation_changes;
    DELETE FROM ecos;
    DELETE FROM eco_stages;
    DELETE FROM bom_operations;
    DELETE FROM bom_components;
    DELETE FROM bom_versions;
    DELETE FROM boms;
    DELETE FROM product_versions;
    DELETE FROM products;
    DELETE FROM refresh_tokens;
    DELETE FROM users;
  `);
}

// Helper: seed roles
async function seedRoles() {
  await pool.query(`
    INSERT INTO roles (id, name) VALUES
      (1, 'engineering'),
      (2, 'approver'),
      (3, 'operations'),
      (4, 'admin')
    ON CONFLICT (id) DO NOTHING
  `);
}

// Helper: seed ECO stages
async function seedStages() {
  await pool.query(`
    INSERT INTO eco_stages (id, name, sequence, requires_approval) VALUES
      (1, 'Draft', 1, false),
      (2, 'Review', 2, true),
      (3, 'Final', 3, false)
    ON CONFLICT DO NOTHING
  `);
}

// Helper: create a user directly in DB with specific role and get token via login
// Since public signup only allows operations role, we insert directly for test users
async function createUserAndLogin(userData = {}) {
  const suffix = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const defaultUser = {
    name: 'Test User',
    email: `test_${suffix}@test.com`,
    password: 'TestPass1!',
    role_id: 1, // engineering
  };
  const user = { ...defaultUser, ...userData };

  // Insert user directly into DB with requested role (bypassing signup role restriction)
  const hashedPassword = await bcrypt.hash(user.password, 10);
  await pool.query(
    'INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4)',
    [user.name, user.email, hashedPassword, user.role_id]
  );

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });

  return {
    user: loginRes.body.data.user,
    accessToken: loginRes.body.data.accessToken,
    refreshToken: loginRes.body.data.refreshToken,
  };
}

// Helper: create a product (requires product_code now)
async function createProduct(token, overrides = {}) {
  const suffix = Date.now();
  const res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      product_code: overrides.product_code || `PROD-${suffix}`,
      name: overrides.name || 'Test Product',
      sale_price: overrides.sale_price || 100,
      cost_price: overrides.cost_price || 50,
      ...overrides,
    });
  return res.body.data;
}

module.exports = {
  app,
  pool,
  request,
  cleanDatabase,
  seedRoles,
  seedStages,
  createUserAndLogin,
  createProduct,
};
