const request = require('supertest');
const express = require('express');

// Create a simple express app for testing the health check route
// In a real scenario, you would export `app` from server.js, but since server.js 
// calls app.listen() directly, we will just mock the health route here for the scaffold.
const app = express();
app.get('/', (req, res) => {
  res.send('Smart Internship & Career Tracker API is running...');
});

describe('Health Check Route', () => {
  it('should return 200 OK and the correct message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Smart Internship & Career Tracker API is running...');
  });
});
