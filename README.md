# Smart Internship & Career Tracker

A production-quality full-stack web application designed for students and job seekers to manage internship/job applications, track interviews, and visualize career growth.

## Tech Stack

- **Frontend:** React + Vite, TailwindCSS (v4), Framer Motion, Recharts, React Router v6, Axios
- **Backend:** Node.js, Express.js, MongoDB + Mongoose, JWT Authentication
- **Security:** bcrypt password hashing, CORS, protected routes

## Folder Structure

```
placement tracker/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI elements (Navbar, Sidebar, etc.)
│   │   ├── pages/       # Route components (Dashboard, Applications, Auth, etc.)
│   │   ├── context/     # React Context for state management (AuthContext)
│   │   ├── services/    # API calls using Axios
│   │   ├── App.jsx      # Main routing
│   │   └── index.css    # Tailwind config and global styles
│   └── package.json
└── server/          # Node.js backend
    ├── config/      # Database connection
    ├── controllers/ # API logic
    ├── middleware/  # JWT Auth and Error handling
    ├── models/      # Mongoose schemas (User, Application)
    ├── routes/      # Express routes
    ├── server.js    # Entry point
    ├── .env         # Environment variables
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/placement-tracker`) OR a MongoDB Atlas connection string.

### Backend Setup
1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Make sure your `.env` file is set up correctly (already generated for you). If you are using MongoDB Atlas, replace the `MONGODB_URI` in `server/.env`.
3. Start the backend development server:
   ```bash
   npm run dev
   # or node server.js if nodemon is not installed
   ```

### Frontend Setup
1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.

## Features
- **User Authentication:** Secure JWT-based login and registration.
- **Interactive Dashboard:** Dynamic charts rendering application statuses and timelines using Recharts.
- **Application Tracker:** Full CRUD capabilities with a sleek glassmorphism UI and Framer Motion animations.
- **Responsive Design:** Fully tailored for mobile, tablet, and desktop viewing.

## Future Enhancements
This structure has been set up with clean, modular architecture, making it ready for potential AI integrations (e.g., AI resume analysis, automated interview generation).
