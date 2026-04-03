import { validateSession } from './sessionService.js';

export async function auth(req, res, next) {
  const sid = req.cookies.sessionId;
  if (!sid) return res.status(401).json({ error: 'Not authenticated' });

  const result = await validateSession(sid);

  if (result === 'REVOKED' || !result) {
  return res.status(401).json({ error: 'Not authenticated' });
}


  req.user = { id: result.user_id };
  req.sessionId = sid;
  next();
}
