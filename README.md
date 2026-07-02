# 🚀 Smart Internship & Career Tracker

A comprehensive, full-stack application designed to be the ultimate productivity platform for students and job seekers. Track your internship applications, manage multiple resumes, monitor your Data Structures & Algorithms (DSA) preparation, and organize interviews all in one unified, beautifully designed dashboard.

## ✨ Features

### 📊 Advanced Analytics Dashboard
- Visualize your application success rates with dynamic, interactive charts (`Recharts`).
- Get actionable productivity insights based on your recent activity and upcoming interviews.

### 🤖 AI Pre-flight & ATS Resume Builder
- Build and customize professional resumes dynamically.
- Run an AI Pre-flight check (powered by Google Gemini) to ensure your resume is ATS-friendly and tailored for your dream job.

### 💬 WhatsApp Nudges via Twilio
- Receive real-time WhatsApp alerts for important interview schedules, application deadlines, and goal milestones directly on your phone.

### 💼 Application Tracker
- Comprehensive CRUD interface to track job applications.
- Log companies, roles, application statuses (Applied, OA, Interview, Selected, Rejected), dates, and specific notes.

### 🤝 Networking & Cold Email Tracker
- Keep track of all your outreach efforts across platforms (LinkedIn, Email, Twitter).
- Monitor communication statuses from "Reached Out" to "Referral Given".
- Save important notes, email templates, and profile links directly.

### 📅 Interactive Calendar
- Visual timeline of all your applications and upcoming interviews.
- Never miss a deadline with a unified view of your placement journey.

### 🎯 Goal Setting Engine
- Gamify your placement process by setting weekly targets for applications, DSA practice, and networking.
- Visual progress bars and a dashboard widget keep you accountable and motivated.

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- TailwindCSS (Utility-first styling, glassmorphism UI)
- Framer Motion (Micro-animations and layout transitions)
- React Router DOM (Client-side routing)
- Recharts (Data visualization)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (NoSQL Database)
- JSON Web Tokens (JWT) for secure authentication
- Google Gemini SDK for AI integrations
- Twilio API for WhatsApp messaging

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account (or local MongoDB server)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sandeep-kumar-270904/my-personal-tracking-system-.git
   cd my-personal-tracking-system-
   ```

2. **Setup the Backend**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory. Refer to the Deployment section for required keys.
   Start the backend server:
   ```bash
   npm start
   ```

3. **Setup the Frontend**
   ```bash
   cd ../client
   npm install
   ```
   Start the frontend development server:
   ```bash
   npm run dev
   ```

4. **Access the App**
   Open your browser and navigate to `http://localhost:5173`.

## 🌐 Deployment Environment Variables

When deploying to platforms like Vercel (Frontend) and Render (Backend), ensure you configure the following variables:

### Frontend (`client/.env`)
```env
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
```

### Backend (`server/.env`)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.vercel.app
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
RESEND_API_KEY=your_resend_api_key
CRON_SECRET=your_cron_secret
```

---
*Built with ❤️ for students striving for their dream placements.*
