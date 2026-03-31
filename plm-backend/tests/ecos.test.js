const { app, pool, request, cleanDatabase, seedRoles, seedStages, createUserAndLogin, createProduct } = require('./setup');

beforeAll(async () => {
  await seedRoles();
});

beforeEach(async () => {
  await cleanDatabase();
  await seedStages();
});

afterAll(async () => {
  await pool.end();
});

describe('ECOs Module', () => {
  let engineerToken;
  let adminToken;
  let productId;

  beforeEach(async () => {
    const engineer = await createUserAndLogin({ role_id: 1, email: `eng_${Date.now()}@test.com` });
    const admin = await createUserAndLogin({ role_id: 4, email: `admin_${Date.now()}@test.com` });
    engineerToken = engineer.accessToken;
    adminToken = admin.accessToken;

    // Create a product using helper
    const product = await createProduct(engineerToken, { name: 'ECO Test Product', sale_price: 100, cost_price: 50 });
    productId = product.id;
  });

  describe('POST /api/ecos', () => {
    it('should create a PRODUCT ECO', async () => {
      const res = await request(app)
        .post('/api/ecos')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({
          title: 'Update pricing',
          type: 'PRODUCT',
          product_id: productId,
          version_update: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.status).toBe('NEW');
      expect(res.body.data.type).toBe('PRODUCT');
      expect(res.body.data.stage).toBeDefined();
    });

    it('should reject ECO for non-existent product', async () => {
      const res = await request(app)
        .post('/api/ecos')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ title: 'Bad ECO', type: 'PRODUCT', product_id: 99999 });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/ecos/:id/changes', () => {
    it('should propose product changes', async () => {
      const ecoRes = await request(app)
        .post('/api/ecos')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ title: 'Price Change', type: 'PRODUCT', product_id: productId });

      const ecoId = ecoRes.body.data.id;

      const res = await request(app)
        .post(`/api/ecos/${ecoId}/changes`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ new_sale_price: 150, new_cost_price: 70 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.new_sale_price).toBe('150');
    });
  });

  describe('POST /api/ecos/:id/submit', () => {
    it('should submit ECO and advance to next stage', async () => {
      const ecoRes = await request(app)
        .post('/api/ecos')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ title: 'Submit Test', type: 'PRODUCT', product_id: productId });

      const ecoId = ecoRes.body.data.id;

      // Propose changes first
      await request(app)
        .post(`/api/ecos/${ecoId}/changes`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ new_sale_price: 200 });

      const res = await request(app)
        .post(`/api/ecos/${ecoId}/submit`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).not.toBe('NEW');
    });

    it('should reject submission without proposed changes', async () => {
      const ecoRes = await request(app)
        .post('/api/ecos')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ title: 'Empty ECO', type: 'PRODUCT', product_id: productId });

      const ecoId = ecoRes.body.data.id;

      const res = await request(app)
        .post(`/api/ecos/${ecoId}/submit`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/ecos/:id/diff', () => {
    it('should return product diff view', async () => {
      const ecoRes = await request(app)
        .post('/api/ecos')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ title: 'Diff Test', type: 'PRODUCT', product_id: productId });

      const ecoId = ecoRes.body.data.id;

      await request(app)
        .post(`/api/ecos/${ecoId}/changes`)
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ new_sale_price: 300, new_cost_price: 120 });

      const res = await request(app)
        .get(`/api/ecos/${ecoId}/diff`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.type).toBe('PRODUCT');
      expect(res.body.data.diff.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/ecos/:id', () => {
    it('should delete ECO in NEW status', async () => {
      const ecoRes = await request(app)
        .post('/api/ecos')
        .set('Authorization', `Bearer ${engineerToken}`)
        .send({ title: 'Delete Me', type: 'PRODUCT', product_id: productId });

      const ecoId = ecoRes.body.data.id;

      const res = await request(app)
        .delete(`/api/ecos/${ecoId}`)
        .set('Authorization', `Bearer ${engineerToken}`);

      expect(res.statusCode).toBe(200);
    });
  });
});
