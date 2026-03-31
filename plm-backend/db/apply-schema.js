require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to database');

  // Apply schema
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema applied successfully');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Schema tables already exist — skipping creation');
    } else {
      throw err;
    }
  }

  // Seed roles
  await client.query(`
    INSERT INTO roles (id, name) VALUES
      (1, 'engineering'), (2, 'approver'), (3, 'operations'), (4, 'admin')
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('Roles seeded');

  // Seed default ECO stages
  await client.query(`
    INSERT INTO eco_stages (id, name, sequence, requires_approval) VALUES
      (1, 'DRAFT', 1, false),
      (2, 'REVIEW', 2, false),
      (3, 'APPROVAL', 3, true),
      (4, 'IMPLEMENTATION', 4, false)
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('ECO stages seeded');

  // Seed default admin user
  const adminHash = await bcrypt.hash('Admin123!', 12);
  await client.query(`
    INSERT INTO users (name, email, password, role_id)
    VALUES ('System Admin', 'admin@plm.local', $1, 4)
    ON CONFLICT (email) DO NOTHING
  `, [adminHash]);
  console.log('Default admin: admin@plm.local / Admin123!');

  // Verify
  const roles = await client.query('SELECT * FROM roles ORDER BY id');
  console.log('Roles:', roles.rows);
  const stages = await client.query('SELECT * FROM eco_stages ORDER BY sequence');
  console.log('ECO Stages:', stages.rows);

  await client.end();
  console.log('Done!');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
