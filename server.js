import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import { pool } from './db.js';
import { rotateSession, logoutOtherSessions } from './sessionService.js';
import { auth } from './authMiddleware.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.post('/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    console.log("==== LOGIN ATTEMPT ====");
    console.log("EMAIL RECEIVED:", email);

    const cleanEmail = email.trim().toLowerCase();

    const { rows } = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (!rows.length) {
      console.log("❌ USER NOT FOUND");
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      console.log("❌ PASSWORD MISMATCH");
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log("✅ LOGIN SUCCESS");

    const newSession = await rotateSession(
      user.id,
      req.headers['user-agent'],
      deviceId || 'unknown-device'
    );

    res.cookie('sessionId', newSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ success: true });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [cleanEmail, hash]
    );

    res.json({ success: true, userId: result.rows[0].id });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/logout-others', auth, async (req, res) => {
  await logoutOtherSessions(req.user.id, req.sessionId);
  res.json({ success: true });
});

app.get('/protected', auth, (req, res) => {
  res.json({ message: 'Secure content' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
