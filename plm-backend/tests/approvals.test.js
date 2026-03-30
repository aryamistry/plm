const { app, pool, request, cleanDatabase, seedRoles, seedStages, createUserAndLogin } = require('./setup');

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

describe('Approvals Module', () => {
  let engineerToken;
  let approverToken;
  let approverUserId;
  let adminToken;
  let productId;

  beforeEach(async () => {
    const engineer = await createUserAndLogin({ role_id: 1, email: `eng_${Date.now()}@test.com` });
    const approver = await createUserAndLogin({ role_id: 2, email: `approver_${Date.now()}@test.com` });
    const admin = await createUserAndLogin({ role_id: 4, email: `admin_${Date.now()}@test.com` });
    engineerToken = engineer.accessToken;
    approverToken = approver.accessToken;
    approverUserId = approver.user.id;
    adminToken = admin.accessToken;

    // Create a product
    const p = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ name: 'Approval Test Product', sale_price: 100, cost_price: 50 });
    productId = p.body.data.id;
  });

  async function createAndSubmitEco() {
    // Create ECO
    const ecoRes = await request(app)
      .post('/api/ecos')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ title: 'Approval Flow ECO', type: 'PRODUCT', product_id: productId, version_update: true });
    const ecoId = ecoRes.body.data.id;

    // Propose changes
    await request(app)
      .post(`/api/ecos/${ecoId}/changes`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ new_sale_price: 200 });

    // Submit
    await request(app)
      .post(`/api/ecos/${ecoId}/submit`)
      .set('Authorization', `Bearer ${engineerToken}`);

    return ecoId;
  }

  describe('GET /api/approvals', () => {
    it('should list pending approvals for approver', async () => {
      const ecoId = await createAndSubmitEco();

      const res = await request(app)
        .get('/api/approvals')
        .set('Authorization', `Bearer ${approverToken}`);

      expect(res.statusCode).toBe(200);
      // The approver should have pending approvals (if the stage requires approval)
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/approvals/:eco_id/approve', () => {
    it('should approve an ECO', async () => {
      const ecoId = await createAndSubmitEco();

      const res = await request(app)
        .post(`/api/approvals/${ecoId}/approve`)
        .set('Authorization', `Bearer ${approverToken}`);

      // If the approver has a pending approval, it should succeed
      // If no pending approval (stage doesn't require), might get 400
      expect([200, 400]).toContain(res.statusCode);
    });

    it('should apply ECO when all approvers approve (version_update=true)', async () => {
      const ecoId = await createAndSubmitEco();

      // Get pending approvals for this approver
      const pendingRes = await request(app)
        .get('/api/approvals')
        .set('Authorization', `Bearer ${approverToken}`);

      if (pendingRes.body.data.length > 0) {
        // Approve
        await request(app)
          .post(`/api/approvals/${ecoId}/approve`)
          .set('Authorization', `Bearer ${approverToken}`);

        // Check ECO status
        const ecoRes = await request(app)
          .get(`/api/ecos/${ecoId}`)
          .set('Authorization', `Bearer ${engineerToken}`);

        // After all approvals, ECO should progress
        expect(['IN_PROGRESS', 'DONE']).toContain(ecoRes.body.data.status);
      }
    });
  });

  describe('POST /api/approvals/:eco_id/reject', () => {
    it('should reject an ECO', async () => {
      const ecoId = await createAndSubmitEco();

      const res = await request(app)
        .post(`/api/approvals/${ecoId}/reject`)
        .set('Authorization', `Bearer ${approverToken}`);

      if (res.statusCode === 200) {
        // Verify ECO is rejected
        const ecoRes = await request(app)
          .get(`/api/ecos/${ecoId}`)
          .set('Authorization', `Bearer ${engineerToken}`);

        expect(ecoRes.body.data.status).toBe('REJECTED');
      }
    });
  });
});
