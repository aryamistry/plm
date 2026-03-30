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

describe('Auth Module', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'John Doe',
          email: 'john@test.com',
          password: 'password123',
          role_id: 1,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe('john@test.com');
      expect(res.body.data.user.role).toBe('engineering');
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'User1', email: 'dup@test.com', password: 'password123', role_id: 1 });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'User2', email: 'dup@test.com', password: 'password123', role_id: 1 });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid role_id', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'User', email: 'bad@test.com', password: 'password123', role_id: 99 });

      expect(res.statusCode).toBe(400);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({});

      expect(res.statusCode).toBe(422);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Login User', email: 'login@test.com', password: 'password123', role_id: 1 });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('login@test.com');
    });

    it('should reject invalid password', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'User', email: 'wrongpw@test.com', password: 'password123', role_id: 1 });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrongpw@test.com', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      const { refreshToken } = await createUserAndLogin();

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Unauthorized access', () => {
    it('should reject requests without token', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toBe(401);
    });
  });
});
