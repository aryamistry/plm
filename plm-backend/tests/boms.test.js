const { app, pool, request, cleanDatabase, seedRoles, createUserAndLogin } = require('./setup');

beforeAll(async () => {
  await seedRoles();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('BoMs Module', () => {
  let engineerToken;
  let product1Id;
  let product2Id;

  beforeEach(async () => {
    const engineer = await createUserAndLogin({ role_id: 1, email: `eng_${Date.now()}@test.com` });
    engineerToken = engineer.accessToken;

    // Create two products for BOM
    const p1 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ name: 'Main Assembly', sale_price: 500 });
    product1Id = p1.body.data.id;

    const p2 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ name: 'Screw M4', sale_price: 0.5 });
    product2Id = p2.body.data.id;
  });

  describe('POST /api/boms', () => {
    it('should create a BOM with components and operations', async () => {
      const res = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          product_id: product1Id,
          components: [{ component_product_id: product2Id, quantity: 12 }],
          operations: [{ operation_name: 'Assembly', time_minutes: 30, work_center: 'WC-01' }],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.current_version.version).toBe(1);
      expect(res.body.data.current_version.components.length).toBe(1);
      expect(res.body.data.current_version.operations.length).toBe(1);
    });

    it('should reject BOM for non-existent product', async () => {
      const res = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          product_id: 99999,
          components: [],
          operations: [],
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/boms', () => {
    it('should list BOMs', async () => {
      await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ product_id: product1Id, components: [], operations: [] });

      const res = await request(app)
        .get('/api/boms')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/boms/:id', () => {
    it('should get a BOM with active version details', async () => {
      const createRes = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          product_id: product1Id,
          components: [{ component_product_id: product2Id, quantity: 8 }],
          operations: [{ operation_name: 'Drill', time_minutes: 15, work_center: 'WC-02' }],
        });

      const bomId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/boms/${bomId}`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.active_version).toBeDefined();
      expect(res.body.data.active_version.components.length).toBe(1);
    });
  });
});
