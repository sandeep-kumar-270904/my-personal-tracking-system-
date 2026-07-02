<div align="center">
  <img src="client/public/vite.svg" alt="StudentTracker Logo" width="120" />
  <h1>🚀 StudentTracker – The Ultimate Placement Operating System</h1>
  <p>
    <em>A comprehensive, AI-powered platform to manage, track, and optimize the entire internship and job placement lifecycle.</em>
  </p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/React-18.x-blue?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-20.x-green?style=flat-square&logo=node.js" alt="Node" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind" />
    <img src="https://img.shields.io/badge/AI-Google_Gemini-FF6F00?style=flat-square&logo=google" alt="Gemini" />
    <img src="https://img.shields.io/badge/Messaging-Twilio-F22F46?style=flat-square&logo=twilio" alt="Twilio" />
  </p>
</div>

<hr />

## 📖 Table of Contents
1. [The Problem](#-the-problem)
2. [The Solution](#-the-solution)
3. [Key Features](#-key-features)
4. [Tech Stack](#%EF%B8%8F-tech-stack)
5. [Architecture & Project Structure](#-architecture--project-structure)
6. [Environment Variables](#-environment-variables)
7. [Getting Started (Local Development)](#-getting-started-local-development)
8. [Deployment Instructions](#-deployment-instructions)
9. [Contributing](#-contributing)

---

## 🎯 The Problem
The modern job hunt is incredibly fragmented. Students and job seekers are forced to juggle Excel sheets for application tracking, separate IDEs for DSA practice, Google Calendars for interviews, different platforms for resume building, and generic email templates for cold outreach. This context-switching leads to missed deadlines, unoptimized resumes, and a high burnout rate during the crucial placement season.

## 💡 The Solution
**StudentTracker** acts as a unified "Placement Operating System." It centralizes the entire hiring pipeline into a single, beautifully designed dashboard. From the moment you build your ATS-compliant resume, to logging your coding practice, scheduling interviews, receiving WhatsApp nudges, and ultimately tracking your compensation packages—everything is managed in one place.

---

## ✨ Key Features

* **🤖 AI-Powered ATS Resume Builder** 
  Construct highly customizable, pixel-perfect PDF resumes. Run your resume through our **Gemini-powered ATS Pre-Flight Checker** to automatically evaluate your "Action-Metric-Impact" bullets and keyword optimization before you apply.
* **💼 Unified Pipeline Tracking** 
  A Kanban-style and list-based application manager. Track companies, roles, and statuses (OA, Interview, Selected, Rejected) with rich text notes.
* **💬 Real-time WhatsApp Nudges** 
  Integrated with **Twilio API**, the platform pushes real-time alerts to your WhatsApp for upcoming interviews, pending tasks, and daily placement goals so you never miss a deadline.
* **🧠 DSA & Coding Contest Hub** 
  Log your Data Structures & Algorithms practice (LeetCode, Codeforces) and track difficulty distribution. The platform automatically fetches upcoming global coding contests and alerts you.
* **🤝 Networking & Cold Outreach CRM** 
  Manage your networking pipeline. Track who you reached out to on LinkedIn/Email, their response status, and save tailored cold-email templates.
* **💰 Offer & Compensation Analytics** 
  Log and compare job offers side-by-side. The dashboard automatically calculates total CTC breakdowns (Base, Sign-On, Equity) and visualizes your success rate via `Recharts`.
* **🎨 Modern, Glassmorphism UI** 
  A deeply satisfying user experience built with TailwindCSS and Framer Motion, featuring global dark/light mode synchronization and micro-animations.

---

## 🛠️ Tech Stack

### Frontend Architecture
* **Framework:** React 18 (Vite)
* **Styling & UI:** TailwindCSS, Framer Motion (Animations), Lucide React (Icons)
* **Data Visualization:** Recharts
* **State Management & Routing:** React Router DOM, Custom Context APIs
* **PDF Generation:** `@react-pdf/renderer`

### Backend Architecture
* **Runtime & Framework:** Node.js, Express.js
* **Database & ORM:** MongoDB, Mongoose
* **Authentication:** JWT (JSON Web Tokens), OAuth 2.0 (Google, GitHub, LinkedIn)
* **AI Engine:** Google Gemini SDK (`@google/genai`)
* **External Services:** Twilio (WhatsApp API), Resend (Email Deliverability), Node-Cron (Background Jobs)

---

## 📂 Architecture & Project Structure

The repository is structured as a standard monorepo separating the client and server concerns:

```text
StudentTracker/
├── client/                 # Frontend React Application
│   ├── public/             # Static assets and PWA Service Worker
│   ├── src/
│   │   ├── components/     # Reusable UI widgets (Modals, Cards, Buttons)
│   │   ├── pages/          # Full page views (Dashboard, ResumeBuilder, Settings, etc.)
│   │   ├── utils/          # Frontend helpers (API interceptors, formatters)
│   │   └── App.jsx         # Root router and global theme provider
│   └── vite.config.js      # Vite build pipeline and PWA configuration
│
└── server/                 # Backend Node/Express API
    ├── config/             # DB connection and environment setup
    ├── controllers/        # Business logic (auth, AI, bot, tracking)
    ├── models/             # Mongoose database schemas
    ├── routes/             # Express API route definitions
    ├── services/           # Reusable backend services (Twilio, Email, Cron)
    └── server.js           # Express application entry point
```

---

## 🔐 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` files.

### Frontend (`client/.env`)
| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | The URL of your backend API (e.g., `http://localhost:5000/api` or `https://api.domain.com/api`) |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud Console |
| `VITE_GITHUB_CLIENT_ID` | OAuth Client ID from GitHub Developer Settings |
| `VITE_LINKEDIN_CLIENT_ID` | OAuth Client ID from LinkedIn Developers |

### Backend (`server/.env`)
| Variable | Description |
| :--- | :--- |
| `PORT` | The port your backend runs on (Default: `5000`) |
| `MONGODB_URI` | Full connection string for your MongoDB cluster |
| `JWT_SECRET` | A secure, random string for signing JWT tokens |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | The URL of your deployed frontend (used for CORS and email links) |
| `GEMINI_API_KEY` | API key from Google AI Studio |
| `GOOGLE_CLIENT_ID` | Same as frontend Google Client ID |
| `GITHUB_CLIENT_ID` / `SECRET` | GitHub OAuth credentials |
| `LINKEDIN_CLIENT_ID` / `SECRET` | LinkedIn OAuth credentials |
| `TWILIO_ACCOUNT_SID` / `TOKEN` | Twilio Console credentials for WhatsApp Sandbox |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `CRON_SECRET` | Secret key to secure internal cron-job endpoints |

---

## 💻 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/sandeep-kumar-270904/my-personal-tracking-system-.git
cd my-personal-tracking-system-
```

### 2. Setup the Backend
```bash
cd server
npm install
```
*Create your `.env` file in the `server` directory as referenced above.*
```bash
# Start the backend server on port 5000
npm run dev
```

### 3. Setup the Frontend
Open a new terminal window:
```bash
cd client
npm install
```
*Create your `.env` file in the `client` directory.*
```bash
# Start the Vite development server
npm run dev
```
Navigate to `http://localhost:5173` to view the application.

---

## 🚀 Deployment Instructions

This application is optimized to be deployed on serverless and PaaS providers.

### Deploying the Frontend (Vercel / Netlify)
1. Connect your GitHub repository to Vercel.
2. Set the root directory to `client`.
3. The build command will automatically be detected as `npm run build` and output directory as `dist`.
4. Add the Frontend Environment Variables in the Vercel dashboard.
5. Deploy.

### Deploying the Backend (Render / Railway)
1. Connect your GitHub repository to Render as a "Web Service".
2. Set the root directory to `server`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add the Backend Environment Variables in the Render dashboard.
6. Deploy.

*(Ensure that the `CLIENT_URL` in Render matches your Vercel URL, and the `VITE_API_URL` in Vercel matches your Render URL).*

---

## 🤝 Contributing
Contributions are always welcome! Whether it's reporting a bug, discussing improvements, or submitting a pull request, your input helps make this tool better for everyone.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
<div align="center">
  <p><i>Built with dedication for students striving to secure their dream careers.</i></p>
</div>
