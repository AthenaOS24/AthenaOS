// __tests__/middleware.test.js

const { app, request, sequelize, registerAndLogin } = require('./utils');

describe('Auth Middleware', () => {
  let authHeader;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    authHeader = (await registerAndLogin()).Authorization;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should return 401 for a protected route without a token', async () => {
    const res = await request(app).get('/api/chat/history');
    expect(res.statusCode).toEqual(401);
  });

  it('should return 401 for a protected route with an invalid token', async () => {
    const res = await request(app)
      .get('/api/chat/history')
      .set('Authorization', 'Bearer badtoken');
    expect(res.statusCode).toEqual(401);
  });

  it('should return 200 for a protected route with a valid token', async () => {
    const res = await request(app)
      .get('/api/chat/history')
      .set('Authorization', authHeader);
    expect(res.statusCode).toEqual(200);
  });
});