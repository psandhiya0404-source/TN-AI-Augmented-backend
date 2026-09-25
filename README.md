# 📚 Study Buddy AI - Full Stack Learning Platform

An AI-powered Study Buddy web application built with **Node.js, Express, React, Vite, and Tailwind CSS**.

---

## ✨ Features Built & Included

1. 🔐 **Login / Register Flow**: Secure JWT authentication with user registration, password hashing (`bcryptjs`), and study goal selection.
2. 🔄 **Session / Token Refresh**: Short-lived access tokens + HTTP-only refresh tokens with automatic client silent refresh interceptor.
3. 📚 **Upload PDF / TXT / MD**: Drag & drop multi-format file uploader with file validation & size checking.
4. 📄 **PDF Text Extraction**: Automatic text parsing for `.pdf` (using `pdf-parse`), `.txt`, and `.md` study notes.
5. 📝 **AI Summaries**: Multi-level summary generator (Executive Overview, Key Takeaways, Key Terminology, Deep-Dive Section Breakdown).
6. 🃏 **Interactive Flashcards**: 3D animated flip cards (Question / Answer / Hint) with status tracking (`Mastered` / `Needs Review`).
7. 🧠 **Quiz + Submit + Score + Try Again**: Interactive multiple-choice quizzes with timer, instant score percentage, correct/incorrect explanations, confetti on high score, and **"Try Again"** mode.
8. 📅 **Study Plan Generator**: Structured daily schedule with target completion days, daily target hours, checkable tasks, and progress tracking.
9. 👤 **User Profile**: Track study streak, mastered cards count, average quiz score, daily goals, and change password.
10. 🗑️ **Uploaded Material Delete**: Complete document & study asset management with safe filesystem cleanup.
11. ❌ **Toast Error System**: Centralized animated notifications for clean validation feedback and error alerts.
12. 🎨 **Dashboard Polish**: Modern dark-mode UI with metrics, progress bars, responsive layout, and quick navigation.

---

## 🚀 How to Run in VS Code

### Option 1: One-Command Startup (Recommended)

1. Open the project folder in VS Code:
   ```bash
   cd "c:\Users\acer\Downloads\Study Buddy 2"
   ```

2. Install all dependencies (Root, Backend, Frontend):
   ```bash
   npm run install-all
   ```

3. Launch both Client and Server concurrently:
   ```bash
   npm run dev
   ```

4. Open your browser at: **`http://localhost:5173`**

---

### Option 2: Running Client and Server in Separate Terminals

#### 1. Start Server (Backend):
```bash
cd server
npm install
npm run dev
```
*(Runs on `http://localhost:5000`)*

#### 2. Start Client (Frontend):
```bash
cd client
npm install
npm run dev
```
*(Runs on `http://localhost:5173`)*

---

## 📂 Project Structure

```
Study Buddy 2/
├── client/                 # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/    # Navbar, Sidebar
│   │   ├── context/       # AuthContext, ToastContext
│   │   ├── pages/         # Dashboard, Materials, Summary, Flashcards, Quiz, StudyPlan, Profile
│   │   ├── services/      # Axios API client with token refresh
│   │   ├── App.jsx        # Routes & ProtectedRoute guard
│   │   └── main.jsx       # App entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express Node.js Backend API
│   ├── src/
│   │   ├── config/        # JSON DB persistence engine
│   │   ├── controllers/   # Auth, Documents, Flashcards, Quizzes, Study Plans
│   │   ├── middleware/    # Auth JWT middleware, Upload Multer middleware
│   │   ├── routes/        # Auth, Documents, Study Assets API routes
│   │   ├── services/      # AI Service & PDF Text Extractor
│   │   └── index.js       # Main Express Server
│   ├── uploads/           # Physical file storage for uploaded study materials
│   └── package.json
│
├── package.json            # Root workspace scripts
└── README.md
```
