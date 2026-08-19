# Developer Operations & Maintenance Guide

This document is intended for DevOps engineers, backend developers, and open-source contributors looking to maintain, test, and scale the StudentTracker platform.

---

## 1. Folder Structure

The project utilizes a standard Monorepo architecture, separating concerns between the client and server.

```text
my-personal-tracking-system-/
│
├── client/                 # React.js Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI elements (Buttons, Modals)
│   │   ├── pages/          # Full route views (Dashboard, Kanban)
│   │   ├── services/       # Axios API interceptors
│   │   └── App.jsx         # React Router configuration
│
├── server/                 # Node.js / Express Backend
│   ├── config/             # Database connection logic
│   ├── controllers/        # Business logic for API endpoints
│   ├── middleware/         # Auth, Rate Limiting, Error Handling
│   ├── models/             # Mongoose Schemas (151 files)
│   ├── routes/             # Express route definitions
│   └── cron/               # Background scheduled jobs
│
└── docs/                   # Enterprise Documentation
```

---

## 2. API Documentation

The RESTful API is prefixed with `/api` and strictly returns JSON.

| Endpoint | Method | Auth Required? | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/register` | `POST` | No | Creates a new user and sends verification email. |
| `/api/auth/login` | `POST` | No | Returns a JWT token upon successful authentication. |
| `/api/applications` | `GET` | Yes | Retrieves all Kanban board applications for the logged-in user. |
| `/api/resumes/:id/cover-letter` | `POST` | Yes | Triggers the Gemini AI to generate a cover letter. |

---

## 3. Environment Variables Configuration

To run the platform locally or in production, the following `.env` files are required.

### `server/.env`
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster...
JWT_SECRET=your_super_secret_jwt_string
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=AIzaSy...
EMAIL_USER=noreply@studenttracker.com
EMAIL_PASS=your_smtp_password
```

### `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Testing Strategy

The project utilizes **Jest** and **Supertest** for automated integration testing, ensuring the database and API routes function correctly without relying on a live MongoDB cluster.

### 4.1 Running Tests
```bash
cd server
npm test
```
*Note: We utilize `mongodb-memory-server` to spin up an ephemeral in-memory database during test execution. This ensures tests run blazingly fast and never pollute production data.*

---

## 5. Security Considerations

We have hardened the Express server against common OWASP Top 10 vulnerabilities:
- **NoSQL Injection:** `express-mongo-sanitize` intercepts all incoming `req.body` and `req.query` payloads and strips out forbidden MongoDB operators (like `$gt`, `$set`).
- **HTTP Header Sniffing:** `helmet` automatically sets rigid CSP (Content Security Policy) and HSTS headers.
- **DDoS / Brute Force:** `express-rate-limit` throttles IPs that make more than 200 requests within a 15-minute window.
- **Authentication:** Passwords are cryptographically hashed using `bcryptjs` before ever touching the database.

---

## 6. Performance & Scalability Considerations

### Current Bottlenecks Solved
- **The N+1 Query Problem:** Previously, the weekly summary cron job fetched data for each user sequentially, blocking the event loop. This was solved by batching requests using `Promise.allSettled()`.
- **Payload Size:** Implemented `compression` middleware to gzip all JSON responses, reducing bandwidth overhead by up to 70%.

### Future Scaling (How to handle 100,000+ users)
If the application hits enterprise scale, the current monolithic Node.js server will bottleneck on AI processing and PDF parsing. 
**Solution:** Extract the `/api/resumes` controller into a separate microservice written in Go or Python, utilizing an AWS SQS queue to handle resume parsing asynchronously via webhooks.

---

## 7. Limitations & Known Issues
- **Schema Bloat:** The database currently features over 150 highly normalized schemas. While excellent for data integrity, this requires heavy `.populate()` calls on reads. Future iterations should denormalize heavily-read data (like embedding Applications directly inside the User document).

---

## 8. Troubleshooting & FAQ

**Q: Why does my Render deployment crash with `MODULE_NOT_FOUND` for `mongodb-memory-server`?**
A: Render runs `npm install --production`, which skips `devDependencies`. Ensure that your `server/config/db.js` does *not* require test-only packages at the top level.

**Q: Social Login (GitHub/Google) redirects to `localhost` in production!**
A: You forgot to set the `CLIENT_URL` environment variable in your production backend to point to your Vercel URL.

**Q: The AI Cover letter generator times out.**
A: The Gemini API occasionally experiences high latency. Ensure your frontend Axios interceptor has a timeout of at least 15000ms (15 seconds) for AI-specific endpoints.
