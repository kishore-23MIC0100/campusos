import type { Request, Response, NextFunction } from 'express';

const attempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 15 * 60 * 1000;
// Per-instance defense. Use a distributed gateway limiter for a multi-instance deployment.
export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST') return next();
  const now = Date.now();
  if (attempts.size > 10000) for (const [key, value] of attempts) if (value.resetAt <= now) attempts.delete(key);
  const key = `${req.ip}:${req.path}`;
  let entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) { entry = { count: 0, resetAt: now + windowMs }; attempts.set(key, entry); }
  if (++entry.count > 30) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
    return res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' });
  }
  next();
}
