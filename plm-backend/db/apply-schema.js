const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:root@localhost:5432/PLM',
  });
  await client.connect();
  console.log('Connected to PLM database');

  // Seed roles if missing
  await client.query(`
    INSERT INTO roles (id, name) VALUES
      (1, 'engineering'), (2, 'approver'), (3, 'operations'), (4, 'admin')
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('Roles seeded');

  // Seed default ECO stages if missing
  await client.query(`
    INSERT INTO eco_stages (id, name, sequence, requires_approval) VALUES
      (1, 'DRAFT', 1, false),
      (2, 'REVIEW', 2, false),
      (3, 'APPROVAL', 3, true),
      (4, 'IMPLEMENTATION', 4, false)
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('ECO stages seeded');

  // Verify
  const roles = await client.query('SELECT * FROM roles ORDER BY id');
  console.log('Roles:', roles.rows);
  const stages = await client.query('SELECT * FROM eco_stages ORDER BY sequence');
  console.log('ECO Stages:', stages.rows);

  await client.end();
  console.log('Done!');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
