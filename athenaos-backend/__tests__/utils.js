// __tests__/utils.js

const request = require('supertest');
const app = require('../server');
const { sequelize } = require('../src/models');

const registerAndLogin = async () => {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'password123';
  
  await request(app).post('/api/auth/register').send({
    username: `testuser_${Date.now()}`,
    email: email,
    password: password,
  });

  const res = await request(app).post('/api/auth/login').send({
    email: email,
    password: password,
  });

  return { 
    Authorization: `Bearer ${res.body.token}`,
    userId: res.body.user.id
  };
};

module.exports = { 
  app, 
  request, 
  sequelize,
  registerAndLogin 
};