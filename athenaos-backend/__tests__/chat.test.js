const { app, request, sequelize, registerAndLogin } = require('./utils');
const { Conversation, Message } = require('../src/models');

describe('Chat API', () => {
  let authHeader;
  let conversationId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const authData = await registerAndLogin();
    authHeader = authData.Authorization;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should return an empty array for a new user history', async () => {
    const res = await request(app)
      .get('/api/chat/history')
      .set('Authorization', authHeader);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });

  it('should send a message and create a new conversation', async () => {
    const res = await request(app)
      .post('/api/chat/send-message')
      .set('Authorization', authHeader)
      .send({ text: 'Hello, this is a test.' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.response).toBe('Hello, I’m Athena (mock)');

    const messages = await Message.findAll();
    expect(messages.length).toBe(2);
    expect(messages[0].sender).toBe('user');
    expect(messages[1].sender).toBe('bot');
    
    const conversation = await Conversation.findOne();
    conversationId = conversation.id;
  });

  it('should get chat history after sending a message', async () => {
    const res = await request(app)
      .get('/api/chat/history')
      .set('Authorization', authHeader);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].messages.length).toBe(2);
    expect(res.body[0].messages[0].text).toBe('Hello, I’m Athena (mock)');
    expect(res.body[0].messages[1].text).toBe('Hello, this is a test.');
  });

  it('should get emotion history for the conversation', async () => {
    expect(conversationId).toBeDefined();
    
    const res = await request(app)
      .get(`/api/chat/${conversationId}/emotions`)
      .set('Authorization', authHeader);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].emotions[0].label).toBe('calm');
  });

  it('should return 400 for an empty message', async () => {
    const res = await request(app)
      .post('/api/chat/send-message')
      .set('Authorization', authHeader)
      .send({ text: '  ' }); 

    expect(res.statusCode).toEqual(400);
    expect(res.body.msg).toBe('Message text cannot be empty');
  });
});