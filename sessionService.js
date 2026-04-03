import crypto from 'crypto';
import { pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';

export async function rotateSession(userId, userAgent, deviceId) {
  const sessionId = uuidv4();

  const uaHash = crypto
    .createHash('sha256')
    .update(userAgent || '')
    .digest('hex');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE sessions
       SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );

    await client.query(
      `INSERT INTO sessions (id, user_id, device_id, user_agent_hash)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, userId, deviceId, uaHash]
    );

    await client.query('COMMIT');
    return sessionId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function validateSession(sessionId) {
  const { rows } = await pool.query(
    `SELECT * FROM sessions WHERE id = $1`,
    [sessionId]
  );

  if (rows.length === 0) return null;
  if (rows[0].revoked_at) return 'REVOKED';

  await pool.query(
    `UPDATE sessions SET last_seen_at = NOW() WHERE id = $1`,
    [sessionId]
  );

  return rows[0];
}

export async function logoutOtherSessions(userId, currentSessionId) {
  await pool.query(
    `UPDATE sessions
     SET revoked_at = NOW()
     WHERE user_id = $1
       AND id != $2
       AND revoked_at IS NULL`,
    [userId, currentSessionId]
  );
}
