// __tests__/tts.test.js

const { app, request, sequelize, registerAndLogin } = require('./utils');

describe('TTS API', () => {
  let authHeader;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    authHeader = (await registerAndLogin()).Authorization;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .post('/api/tts/synthesize')
      .send({ text: 'Hello' });
    expect(res.statusCode).toEqual(401);
  });

  it('should return 200 and audio content with a valid token', async () => {
    const res = await request(app)
      .post('/api/tts/synthesize')
      .set('Authorization', authHeader)
      .send({ text: 'Hello world' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('audioContent');
  });

  it('should return 400 if text is missing', async () => {
    const res = await request(app)
      .post('/api/tts/synthesize')
      .set('Authorization', authHeader)
      .send({ text: '' });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Text is required');
  });
});