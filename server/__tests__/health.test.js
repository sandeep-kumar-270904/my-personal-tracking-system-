const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Health Check Route', () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('should return 200 OK and the correct message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Smart Internship & Career Tracker API is running...');
  });
});
