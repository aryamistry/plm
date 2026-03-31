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

describe('Full ECO Lifecycle', () => {
  let engineerToken, approverToken, approverUser;
  let product;

  beforeEach(async () => {
    const engineer = await createUserAndLogin({ role_id: 1, email: `eng_${Date.now()}@test.com` });
    const approver = await createUserAndLogin({ role_id: 2, email: `approver_${Date.now()}@test.com` });
    engineerToken = engineer.accessToken;
    approverToken = approver.accessToken;
    approverUser = approver.user;

    product = await createProduct(engineerToken);
  });

  it('Product ECO: NEW → propose → submit → approve → DONE → new version created', async () => {
    // 1. Create ECO (version_update: true)
    const ecoRes = await request(app)
      .post('/api/ecos')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ title: 'Price Increase v2', type: 'PRODUCT', product_id: product.id, version_update: true });
    expect(ecoRes.statusCode).toBe(201);
    const ecoId = ecoRes.body.data.id;
    expect(ecoRes.body.data.status).toBe('NEW');

    // 2. Propose changes (new_sale_price: 200)
    const proposeRes = await request(app)
      .post(`/api/ecos/${ecoId}/changes`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ new_sale_price: 200, new_cost_price: 80 });
    expect(proposeRes.statusCode).toBe(200);

    // 3. Submit ECO (moves to Review stage which requires approval)
    const submitRes = await request(app)
      .post(`/api/ecos/${ecoId}/submit`)
      .set('Authorization', `Bearer ${engineerToken}`);
    expect(submitRes.statusCode).toBe(200);
    expect(submitRes.body.data.status).toBe('IN_PROGRESS');

    // 4. Approver approves
    const approveRes = await request(app)
      .post(`/api/approvals/${ecoId}/approve`)
      .set('Authorization', `Bearer ${approverToken}`);
    expect(approveRes.statusCode).toBe(200);

    // 5. Verify ECO is DONE
    const ecoDetail = await request(app)
      .get(`/api/ecos/${ecoId}`)
      .set('Authorization', `Bearer ${engineerToken}`);
    expect(ecoDetail.body.data.status).toBe('DONE');

    // 6. Verify product versions
    const versions = await request(app)
      .get(`/api/products/${product.id}/versions`)
      .set('Authorization', `Bearer ${engineerToken}`);
    const activeVersion = versions.body.data.find(v => v.status === 'ACTIVE');
    const archivedVersion = versions.body.data.find(v => v.status === 'ARCHIVED');
    expect(activeVersion.version).toBe(2);
    expect(parseFloat(activeVersion.sale_price)).toBe(200);
    expect(archivedVersion.version).toBe(1);
  });

  it('In-place update (version_update: false) — no new version created', async () => {
    // Create ECO with version_update: false
    const ecoRes = await request(app)
      .post('/api/ecos')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ title: 'In-place fix', type: 'PRODUCT', product_id: product.id, version_update: false });
    const ecoId = ecoRes.body.data.id;

    // Propose changes
    await request(app)
      .post(`/api/ecos/${ecoId}/changes`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ new_sale_price: 150 });

    // Submit
    await request(app)
      .post(`/api/ecos/${ecoId}/submit`)
      .set('Authorization', `Bearer ${engineerToken}`);

    // Approve
    await request(app)
      .post(`/api/approvals/${ecoId}/approve`)
      .set('Authorization', `Bearer ${approverToken}`);

    // Verify: only 1 version, sale_price updated
    const versions = await request(app)
      .get(`/api/products/${product.id}/versions`)
      .set('Authorization', `Bearer ${engineerToken}`);
    expect(versions.body.data.length).toBe(1);
    expect(versions.body.data[0].status).toBe('ACTIVE');
    expect(parseFloat(versions.body.data[0].sale_price)).toBe(150);
  });

  it('BOM ECO lifecycle — component quantity change', async () => {
    // Create component product
    const comp = await createProduct(engineerToken, { product_code: `COMP-${Date.now()}`, name: 'Component A' });

    // Create BOM
    const bomRes = await request(app)
      .post('/api/boms')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        product_id: product.id,
        components: [{ component_product_id: comp.id, quantity: 5 }],
        operations: [{ operation_name: 'Assembly', time_minutes: 30, work_center: 'WC-1' }],
      });
    expect(bomRes.statusCode).toBe(201);
    const bomId = bomRes.body.data.id;

    // Create BOM ECO
    const ecoRes = await request(app)
      .post('/api/ecos')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ title: 'Update BOM', type: 'BOM', product_id: product.id, bom_id: bomId, version_update: true });
    const ecoId = ecoRes.body.data.id;

    // Propose BOM changes
    await request(app)
      .post(`/api/ecos/${ecoId}/changes`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        component_changes: [{ component_product_id: comp.id, old_quantity: 5, new_quantity: 10 }],
        operation_changes: [{ operation_name: 'Assembly', old_time_minutes: 30, new_time_minutes: 45 }],
      });

    // Submit
    await request(app)
      .post(`/api/ecos/${ecoId}/submit`)
      .set('Authorization', `Bearer ${engineerToken}`);

    // Approve
    await request(app)
      .post(`/api/approvals/${ecoId}/approve`)
      .set('Authorization', `Bearer ${approverToken}`);

    // Verify BOM versions
    const bomVersions = await request(app)
      .get(`/api/boms/${bomId}/versions`)
      .set('Authorization', `Bearer ${engineerToken}`);
    const activeBomVer = bomVersions.body.data.find(v => v.status === 'ACTIVE');
    expect(activeBomVer.version).toBe(2);
    expect(parseFloat(activeBomVer.components[0].quantity)).toBe(10);
    expect(activeBomVer.operations[0].time_minutes).toBe(45);
  });
});

describe('ECO Rejection Flow', () => {
  let engineerToken, approverToken;
  let productId;

  beforeEach(async () => {
    const engineer = await createUserAndLogin({ role_id: 1, email: `eng2_${Date.now()}@test.com` });
    const approver = await createUserAndLogin({ role_id: 2, email: `approver2_${Date.now()}@test.com` });
    engineerToken = engineer.accessToken;
    approverToken = approver.accessToken;

    const product = await createProduct(engineerToken);
    productId = product.id;
  });

  it('should reject ECO and mark all pending approvals as rejected', async () => {
    // Create, propose, submit
    const ecoRes = await request(app)
      .post('/api/ecos')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ title: 'To Be Rejected', type: 'PRODUCT', product_id: productId });
    const ecoId = ecoRes.body.data.id;

    await request(app)
      .post(`/api/ecos/${ecoId}/changes`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ new_sale_price: 999 });

    await request(app)
      .post(`/api/ecos/${ecoId}/submit`)
      .set('Authorization', `Bearer ${engineerToken}`);

    // Reject
    const rejectRes = await request(app)
      .post(`/api/approvals/${ecoId}/reject`)
      .set('Authorization', `Bearer ${approverToken}`);
    expect(rejectRes.statusCode).toBe(200);

    // Verify ECO status
    const ecoDetail = await request(app)
      .get(`/api/ecos/${ecoId}`)
      .set('Authorization', `Bearer ${engineerToken}`);
    expect(ecoDetail.body.data.status).toBe('REJECTED');

    // Verify all approvals are REJECTED
    for (const approval of ecoDetail.body.data.approvals) {
      expect(approval.status).toBe('REJECTED');
    }
  });

  it('should prevent non-approver from rejecting', async () => {
    const ecoRes = await request(app)
      .post('/api/ecos')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ title: 'Engineer rejects', type: 'PRODUCT', product_id: productId });
    const ecoId = ecoRes.body.data.id;

    await request(app)
      .post(`/api/ecos/${ecoId}/changes`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ new_sale_price: 100 });

    await request(app)
      .post(`/api/ecos/${ecoId}/submit`)
      .set('Authorization', `Bearer ${engineerToken}`);

    // Engineer tries to reject — should fail
    const rejectRes = await request(app)
      .post(`/api/approvals/${ecoId}/reject`)
      .set('Authorization', `Bearer ${engineerToken}`);
    expect(rejectRes.statusCode).toBe(403); // Unauthorized role
  });
});
