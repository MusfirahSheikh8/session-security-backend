# 🔐 Session Security Backend (Node.js + PostgreSQL)

A production-style backend system implementing secure session-based authentication with session rotation, device tracking, and revocation.

---

## 🎥 Demo

https://www.loom.com/share/4673a20acc24434084d4d1ec3f8cc93c

- Register user
- Login from device-1
- Login from device-2
- First session gets revoked

👉 Only one active session at a time

## 🚀 Features

- ✅ User Registration
- ✅ Secure Login with password hashing (bcrypt)
- ✅ Session-based authentication (HTTP-only cookies)
- ✅ Session Rotation (only one active session per user)
- ✅ Device tracking (deviceId + user-agent hash)
- ✅ Logout from other devices
- ✅ Protected routes with middleware
- ✅ PostgreSQL transactions for consistency

---

## 🏗️ Tech Stack

- Node.js
- Express.js
- PostgreSQL
- bcrypt
- cookie-parser
- uuid

---

## 📁 Project Structure


.
├── server.js # Main server file
├── db.js # Database connection
├── sessionService.js # Session logic (rotate, validate, revoke)
├── authMiddleware.js # Auth middleware
├── package.json
└── .env # Environment variables


---

## ⚙️ Setup Instructions

### 1. Clone the project

```bash
cd session-security-backend
```

2. Install dependencies
```
npm install
```

3. Setup PostgreSQL Database

Create database:

CREATE DATABASE session_security;
4. Create Tables
```
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT,
  user_agent_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP NULL
);
```
5. Configure Environment Variables

Create .env file:

DATABASE_URL=postgresql://postgres:password@localhost:5432/session_security
NODE_ENV=development
6. Run the server
node server.js

Server runs on:

http://localhost:3000


🔑 API Endpoints

🔐 Register

POST /register

Body:

{
  "email": "test@test.com",
  "password": "123456"
}
🔐 Login
POST /login
Creates new session
Revokes all previous sessions
🔐 Protected Route
GET /protected

Requires valid session cookie.

🔐 Logout Other Sessions
POST /logout-others

Revokes all sessions except current one.

🔁 Session Rotation Logic

On every login:

All previous sessions are revoked:
UPDATE sessions SET revoked_at = NOW()
WHERE user_id = $1 AND revoked_at IS NULL;
New session is created

👉 Ensures:

Only ONE active session per user
Prevents session hijacking


🔒 Security Features

Password hashing using bcrypt
HTTP-only cookies (prevents XSS access)
Secure cookies in production
Session revocation system
Transaction-safe session rotation
Device tracking (deviceId + user-agent)


🧪 Testing Flow
Register user
Login (device-1)
Login again (device-2)

Expected:

device-1 → revoked
device-2 → active


🚀 Future Improvements

JWT + Refresh Token system
Session dashboard (view active devices)
IP address tracking
Session expiration
Rate limiting
Email verification


📌 Author

Musfirah Sheikh
Full Stack Developer
