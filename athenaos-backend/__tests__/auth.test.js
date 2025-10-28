// __tests__/auth.test.js

const { app, request, sequelize } = require('./utils');
const { User } = require('../src/models');

describe('Authentication API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should return 400 if email already exists', async () => {
      await request(app).post('/api/auth/register').send({
        username: 'user1', email: 'test@example.com', password: 'password123',
      });
      const res = await request(app).post('/api/auth/register').send({
        username: 'user2', email: 'test@example.com', password: 'password123',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body.msg).toBe('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        username: 'loginuser', email: 'login@example.com', password: 'password123',
      });
    });

    it('should log in an existing user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.msg).toBe('Invalid Credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data for a valid token', async () => {
      await request(app).post('/api/auth/register').send({
        username: 'me_user', email: 'me@example.com', password: 'password123',
      });
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'me@example.com', password: 'password123',
      });
      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.email).toBe('me@example.com');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
    });
  });
});