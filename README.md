# SurakshaSetu — Women & Child Safety Platform

A complete, full-stack web application for women and child safety, complaint management and legal awareness.

## 🚀 Quick Start

### Frontend (Vite + React + TypeScript)
```bash
cd client
npm install
npm run dev
```
Frontend runs on **http://localhost:5173**

### Backend (Node.js + Express + MongoDB)
```bash
cd server
npm install
# Copy and configure .env
cp .env.example .env
npm run dev
```
Backend runs on **http://localhost:5000**

> The Vite dev server is configured to proxy `/api/*` requests to the backend at port 5000.

---

## 📁 Project Structure

```
suraksha-setu/
├── client/                     # React + Vite + TypeScript frontend
│   ├── public/
│   │   └── hero-illustration.png
│   └── src/
│       ├── components/
│       │   ├── Navbar.tsx       # Responsive sticky navbar
│       │   ├── AwarenessTicker.tsx
│       │   └── Footer.tsx
│       ├── contexts/
│       │   ├── ThemeContext.tsx  # Light/Dark mode
│       │   └── AuthContext.tsx   # JWT auth state
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── ReportPage.tsx    # Multi-step complaint form
│       │   ├── TrackPage.tsx     # Case tracking
│       │   ├── LegalPage.tsx     # POSH, POCSO, Vishaka
│       │   ├── SafetyPage.tsx    # Safety assistant + helplines
│       │   ├── ProofVaultPage.tsx
│       │   ├── RespondentPortalPage.tsx
│       │   ├── StaffLoginPage.tsx
│       │   └── DashboardPage.tsx # Protected staff dashboard
│       ├── index.css             # Design system (CSS variables)
│       └── App.tsx               # Router
│
└── server/                     # Node.js + Express backend
    └── src/
        ├── config/database.js
        ├── controllers/
        │   ├── auth.controller.js
        │   └── case.controller.js
        ├── middleware/auth.middleware.js
        ├── models/
        │   ├── User.js
        │   ├── Case.js
        │   ├── CaseUpdate.js
        │   ├── Evidence.js
        │   ├── LegalResource.js
        │   └── AuditLog.js
        ├── routes/
        │   ├── auth.routes.js
        │   ├── case.routes.js
        │   ├── evidence.routes.js
        │   ├── resource.routes.js
        │   └── staff.routes.js
        └── app.js
```

---

## 🔐 Security Features

- **Recovery codes** are hashed with bcrypt — never stored in plain text
- **JWT tokens** stored as httpOnly cookies (not localStorage)
- **Rate limiting** on all API routes (stricter on submission routes)
- **Role-based authorization** enforced in backend middleware
- **Input validation** using Zod schemas
- **File upload restrictions**: type whitelist + 10MB max + 5 files max
- **CORS** configured to allow only the frontend origin
- **Helmet** security headers
- **Audit logs** with 2-year TTL

---

## 🌗 Theme System

The theme toggle button in the navbar switches between Light and Dark mode.
- Preference saved in `localStorage` as `ss-theme`
- System preference detected on first visit
- Theme applied before first render via inline `<script>` to prevent flash

---

## 🔗 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | — | Staff login |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/auth/logout` | JWT | Logout |
| POST | `/api/auth/setup-admin` | — | Create first admin (once only) |
| POST | `/api/cases` | — | Submit complaint |
| POST | `/api/cases/track` | — | Track case with recovery code |
| GET | `/api/cases` | Staff | List cases (filtered by role) |
| PATCH | `/api/cases/:id/status` | Staff | Update case status |
| POST | `/api/evidence/:caseId` | — | Upload evidence files |
| GET | `/api/resources/legal` | — | Get legal resources |
| GET | `/api/resources/support` | — | Get support resources |
| GET | `/api/staff` | Admin | List staff |
| POST | `/api/staff` | Admin | Create staff account |

---

## ⚠️ Environment Variables (server/.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/suraksha-setu
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE=10485760
```

> **Never commit `.env` to version control.** Use `.env.example` as a template.

---

## 📋 Creating the First Admin Account

After starting the server with a running MongoDB connection, call this endpoint **once**:
```
POST http://localhost:5000/api/auth/setup-admin
Content-Type: application/json

{
  "name": "Admin Name",
  "email": "admin@organization.com",
  "password": "strongpassword123"
}
```
This endpoint is disabled once an admin exists.

---

## 🏛️ Legal Information

- POSH Act information sourced from official Ministry of WCD documents
- POCSO Act information sourced from official Ministry of WCD documents
- Vishaka Guidelines reference is to the Supreme Court of India
- All legal content includes disclaimers noting it is for educational purposes only

---

## 📞 Emergency Contacts (Verified)

| Helpline | Number |
|---------|--------|
| Police Emergency | 112 |
| Women Helpline | 181 |
| Childline | 1098 |
| NCW Helpline | 7827170170 |
| iCall (Counselling) | 9152987821 |
| NALSA (Legal Aid) | 15100 |
