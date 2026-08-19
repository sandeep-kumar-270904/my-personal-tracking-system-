<div align="center">
  <img src="https://my-personal-tracking-system-jrnr.vercel.app/pwa-192x192.png" alt="StudentTracker Logo" width="120" />
  <h1>Student Placement Tracker OS</h1>
  <p><em>The ultimate, AI-powered operating system for university placements and career management.</em></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Node.js CI](https://github.com/sandeep-kumar-270904/my-personal-tracking-system-/actions/workflows/ci.yml/badge.svg)](https://github.com/sandeep-kumar-270904/my-personal-tracking-system-/actions/workflows/ci.yml)
  [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
</div>

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Key Features](#-key-features)
- [Screenshots & Demo](#-screenshots--demo)
- [Technology Stack](#-technology-stack)
- [Installation Guide](#-installation-guide)
- [Docker Setup](#-docker-setup)
- [Deployment Guide](#-deployment-guide)
- [Deep Dive Documentation](#-deep-dive-documentation)
- [Contributing](#-contributing)
- [License & Credits](#-license--credits)

---

## 🚀 Project Overview
**StudentTracker** is an enterprise-grade, full-stack career management platform designed to solve the chaos of university placement seasons. It replaces messy spreadsheets and disjointed calendar apps with a centralized, AI-enhanced dashboard. It tracks job applications, scheduled interviews, Data Structures & Algorithms (DSA) progress, and networking contacts, while utilizing Google Gemini AI to analyze resumes and generate personalized cover letters dynamically.

## ⚠️ Problem Statement
During peak placement seasons, university students suffer from severe context switching. They track job applications on Excel, solve coding problems on LeetCode, schedule interviews on Google Calendar, and write cover letters on ChatGPT. This fragmentation leads to missed deadlines, unoptimized resumes, and severe burnout. There is no singular, opinionated tool designed strictly for the lifecycle of a software engineering candidate.

## ✨ Key Features
- **Centralized Kanban Application Tracking:** Visually drag-and-drop job applications across stages (Applied -> Interviewing -> Offered).
- **Google Gemini AI Integration:** Upload a PDF resume to instantly generate tailored cover letters and receive ATS optimization feedback.
- **DSA & LeetCode Tracker:** Log daily problem-solving metrics and track algorithmic mastery over time.
- **Automated Communication:** Push notifications, Twilio WhatsApp integration, and Resend email digests keep candidates informed of impending interviews.
- **Enterprise Security:** JWT-based authentication, OAuth2.0 (Google, GitHub, LinkedIn), Express rate-limiting, Helmet headers, and NoSQL injection sanitization.
- **Continuous Integration (CI):** Fully automated Jest testing pipeline via GitHub Actions.

## 📸 Screenshots & Demo

| Dashboard Overview | Application Kanban |
| :---: | :---: |
| *(Insert Dashboard Screenshot)* | *(Insert Kanban Screenshot)* |
| **AI Cover Letter Generator** | **DSA Progress Tracking** |
| *(Insert AI Feature Screenshot)* | *(Insert DSA Tracker Screenshot)* |

### Demo Instructions
The platform is currently live! 
👉 **[View Live Deployment](https://my-personal-tracking-system-jrnr.vercel.app/)**

*To test the platform, you can create a new account using the traditional sign-up form, or use the GitHub/Google single sign-on.*

## 🛠 Technology Stack

### Frontend Architecture
- **React.js 19 (Vite):** Chosen for its blazing-fast HMR and optimized production builds. React 19 concurrent features provide a liquid-smooth UX during heavy Kanban drag-and-drop operations.
- **Tailwind CSS:** Utility-first CSS framework enabling rapid, highly-responsive UI prototyping without external CSS bloat.
- **Axios:** For intercepted, token-bearing HTTP requests to the backend API.

### Backend Architecture
- **Node.js & Express.js:** Event-driven, non-blocking I/O model perfectly suited for handling concurrent asynchronous requests like AI processing and PDF parsing.
- **MongoDB & Mongoose:** A highly normalized schema architecture (151 schemas) ensuring strict data validation and referential integrity across the complex placement ecosystem.
- **Google Gemini API (`@google/genai`):** Used for advanced Natural Language Processing on candidate resumes.
- **Jest & Supertest:** Comprehensive automated integration testing suite.

## 💻 Installation Guide

### Prerequisites
- Node.js (v20 or higher)
- MongoDB (Local instance or Atlas URI)
- API Keys: Google Gemini, Twilio, Resend, Google OAuth, GitHub OAuth, LinkedIn OAuth.

### Local Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/sandeep-kumar-270904/my-personal-tracking-system-.git
   cd my-personal-tracking-system-
   ```
2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env # Add your MongoDB URI and API keys
   npm run dev
   ```
3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   cp .env.example .env # Add your VITE_API_URL
   npm run dev
   ```

## 🐳 Docker Setup
For universal, environment-agnostic deployment, the backend includes a production-ready `Dockerfile`.

```bash
cd server
docker build -t student-tracker-backend .
docker run -p 5000:5000 --env-file .env student-tracker-backend
```

## 🌍 Deployment Guide
This repository is optimized for modern PaaS deployments (Vercel for Frontend, Render for Backend).

1. **Backend (Render):**
   - Connect the repository to Render as a "Web Service".
   - Set Root Directory to `server`.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add all `.env` variables (crucially: `CLIENT_URL` for OAuth redirects).
2. **Frontend (Vercel):**
   - Connect the repository to Vercel.
   - Set Root Directory to `client`.
   - Add the `VITE_API_URL` environment variable pointing to the live Render URL.

## 📚 Deep Dive Documentation
For Senior Engineers, System Architects, and open-source contributors, please refer to the deep-dive documentation:
- **[System Architecture & Design Docs](./docs/SYSTEM_ARCHITECTURE.md)** (HLD, LLD, Database ER, Auth flows)
- **[Developer Operations Guide](./docs/DEVELOPER_GUIDE.md)** (API Reference, Scalability, Security, Testing)

## 🤝 Contributing
We welcome contributions from the community! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes. 

*Note: All PRs must pass the GitHub Actions Jest testing pipeline before they can be merged.*

## 📄 License & Credits
- **License:** Distributed under the MIT License. See `LICENSE` for more information.
- **Credits:** Developed by Sandeep Kumar. Special thanks to the Google Gemini team for providing the LLM infrastructure powering the AI resume features.
