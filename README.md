# 🚀 Smart Internship & Career Tracker

A comprehensive, full-stack application designed to be the ultimate productivity platform for students and job seekers. Track your internship applications, manage multiple resumes, monitor your Data Structures & Algorithms (DSA) preparation, and organize interviews all in one unified, beautifully designed dashboard.

![Dashboard Preview](client/public/vite.svg) <!-- Replace with actual screenshot later -->

## ✨ Features (MVP 2)

### 📊 Advanced Analytics Dashboard
- Visualize your application success rates with dynamic, interactive charts (`Recharts`).
- Get actionable productivity insights based on your recent activity and upcoming interviews.

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

### 💰 Offer & Compensation Tracker
- Compare job offers side-by-side to make the best career decisions.
- Automatically calculates total CTC from Base Salary, Sign-On Bonus, and RSUs.
- Visual stacked bar charts breakdown your compensation structure.

### 📄 Resume Manager
- Version control for your resumes. Track which resume is tailored for which specific industry or role.
- Add drive links and descriptions for quick access during applications.

### 🧠 DSA Tracker
- Stay consistent with your technical preparation.
- Log problems solved across platforms (LeetCode, Codeforces, etc.), categorize by difficulty (Easy, Medium, Hard), and track completion status.

### 📅 Interview Planner
- Never miss a schedule. Track upcoming interview dates, types (Technical, HR, OA), and prep notes.

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
- bcryptjs for password hashing

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account (or local MongoDB server)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sandeep-kumar-270904/Student-Placement-Tracker-.git
   cd Student-Placement-Tracker-
   ```

2. **Setup the Backend**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   NODE_ENV=development
   ```
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

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

---
*Built with ❤️ for students striving for their dream placements.*
