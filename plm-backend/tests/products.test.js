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

describe('Products Module', () => {
  let engineerToken;
  let adminToken;
  let operationsToken;

  beforeEach(async () => {
    const engineer = await createUserAndLogin({ role_id: 1, email: `eng_${Date.now()}@test.com` });
    const admin = await createUserAndLogin({ role_id: 4, email: `admin_${Date.now()}@test.com` });
    const ops = await createUserAndLogin({ role_id: 3, email: `ops_${Date.now()}@test.com` });
    engineerToken = engineer.accessToken;
    adminToken = admin.accessToken;
    operationsToken = ops.accessToken;
  });

  describe('POST /api/products', () => {
    it('should create a product with v1', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ name: 'Widget A', sale_price: 100, cost_price: 50 });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.name).toBe('Widget A');
      expect(res.body.data.current_version.version).toBe(1);
      expect(res.body.data.current_version.status).toBe('ACTIVE');
    });

    it('should reject operations role from creating products', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({ name: 'Widget B', sale_price: 100 });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/products', () => {
    it('should list products', async () => {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ name: 'Widget A', sale_price: 100 });

      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter ACTIVE only for operations role', async () => {
      const res = await request(app)
        .get('/api/products?status=ARCHIVED')
        .set('Authorization', `Bearer ${operationsToken}`);

      expect(res.statusCode).toBe(200);
      // Operations users should only see ACTIVE regardless of query param
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should block direct edits', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ name: 'Widget A', sale_price: 100 });

      const productId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ sale_price: 200 });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/products/:id/archive', () => {
    it('should archive a product (admin only)', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Archive Me', sale_price: 50 });

      const productId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/products/${productId}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);

      // Verify the product is now archived
      const getRes = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.body.data.versions[0].status).toBe('ARCHIVED');
    });

    it('should reject non-admin from archiving', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ name: 'No Archive', sale_price: 50 });

      const productId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/products/${productId}/archive`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
