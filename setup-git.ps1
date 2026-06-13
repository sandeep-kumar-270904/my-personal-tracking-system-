git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore

# Initial commit: Config and basic files
git add .gitignore
git commit -m "chore: initial project setup and gitignore"

# Commit: Server and package files
git add server/package.json server/package-lock.json server/config
git commit -m "chore: setup server dependencies and database config"

# Commit: Backend Auth and App Models
git add server/models/User.js server/models/Application.js server/middleware server/routes/authRoutes.js server/routes/appRoutes.js server/controllers/authController.js server/controllers/appController.js server/server.js
git commit -m "feat: core backend authentication and application tracking APIs"

# Commit: Frontend Setup
git add client/package.json client/package-lock.json client/vite.config.js client/tailwind.config.js client/postcss.config.js client/index.html client/src/main.jsx client/src/index.css
git commit -m "chore: setup frontend react app with tailwind"

# Commit: Frontend Core and Components
git add client/src/App.jsx client/src/context client/src/components client/src/services
git commit -m "feat: frontend routing, authentication context, and sidebar navigation"

# Commit: Basic Pages
git add client/src/pages/LandingPage.jsx client/src/pages/LoginPage.jsx client/src/pages/SignupPage.jsx client/src/pages/DashboardPage.jsx client/src/pages/ApplicationsPage.jsx
git commit -m "feat: implement auth pages, dashboard, and applications manager"

# Commit: MVP 2 Backend Additions
git add server/models/Resume.js server/models/DSA.js server/models/Interview.js server/routes/resumeRoutes.js server/routes/dsaRoutes.js server/routes/interviewRoutes.js server/controllers/resumeController.js server/controllers/dsaController.js server/controllers/interviewController.js
git commit -m "feat: expand backend models and APIs for resumes, dsa, and interviews"

# Commit: MVP 2 Frontend Enhancements
git add client/src/pages/ResumesPage.jsx client/src/pages/DSAPage.jsx client/src/pages/InterviewsPage.jsx
git add .
git commit -m "feat: integrate resume manager, dsa tracker, and interview planner into UI"
