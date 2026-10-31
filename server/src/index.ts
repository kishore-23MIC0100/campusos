import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import { readSharedPortalConfig, applySharedPortalAccounts } from './shared-portal-accounts.js';
import { getJwtSecret } from './middleware/auth.js';
import { accessPolicy } from './middleware/access.js';
import { authRateLimit } from './middleware/rate-limit.js';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import studentsRoutes from './routes/students.js';
import teachersRoutes from './routes/teachers.js';
import parentsRoutes from './routes/parents.js';
import attendanceRoutes from './routes/attendance.js';
import leaveRoutes from './routes/leave.js';
import homeworkRoutes from './routes/homework.js';
import timetableRoutes from './routes/timetable.js';
import eventsRoutes from './routes/events.js';
import announcementsRoutes from './routes/announcements.js';
import spotlightRoutes from './routes/spotlight.js';
import performanceRoutes from './routes/performance.js';
import schoolRoutes from './routes/school.js';
import auditRoutes from './routes/audit.js';
import notificationsRoutes from './routes/notifications.js';
import reportsRoutes from './routes/reports.js';
import payrollRoutes from './routes/payroll.js';
import staffRoutes from './routes/staff.js';
import assessmentsRoutes from './routes/assessments.js';
import transportRoutes from './routes/transport.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const production = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
if (production) { getJwtSecret(); if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production.'); }
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || (production ? 'https://campusos-sable.vercel.app' : 'http://localhost:5173,http://127.0.0.1:5173')).split(',').map(origin => origin.trim()));
app.disable('x-powered-by');
if (process.env.VERCEL) app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
  credentials: true,
}));
app.use(express.json({ limit: '3mb' }));
app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); res.setHeader('Cache-Control', 'no-store'); next(); });
app.use('/api/auth', authRateLimit);

const clients = new Set<WebSocket>();

if (process.env.DATABASE_URL || process.env.VERCEL) {
  // Vercel serverless functions have no durable local disk. Serialize each API
  // request through Neon and commit the state before the response is closed.
  app.use('/api', async (req, res, next) => {
    const db = initDatabase();
    let finishRequest: ((commit?: boolean) => Promise<void>) | null = null;
    try {
      finishRequest = await db.beginRequest();
      applySharedPortalAccounts(db, readSharedPortalConfig());
      if (!production && process.env.ENABLE_DEMO_SEED === 'true' && !db.hasUsers()) await seedDatabase();
      if (!db.prepare('SELECT id FROM roles WHERE name = ?').get('STAFF')) {
        db.prepare('INSERT INTO roles (id, name, description, is_system) VALUES (?, ?, ?, ?)')
          .run('role_staff', 'STAFF', 'Non-teaching staff self-service access', 1);
        db.scheduleSave();
      }

      const originalEnd = res.end.bind(res);
      let ending = false;
      res.end = ((...args: any[]) => {
        if (ending) return res;
        ending = true;
        void finishRequest!(res.statusCode < 500)
          .then(() => originalEnd(...args as Parameters<typeof res.end>))
          .catch((error) => {
            console.error('[Database Commit Error]', error);
            if (!res.headersSent) {
              res.statusCode = 503;
              res.removeHeader('Content-Length');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              return originalEnd(JSON.stringify({ error: 'Could not save CampusOS data. Please retry.', code: 'DATABASE_UNAVAILABLE' }));
            }
            return originalEnd(...args as Parameters<typeof res.end>);
          });
        return res;
      }) as typeof res.end;
      res.once('close', () => { if (!res.writableEnded) void finishRequest!(false).catch(error => console.error('[Database Release Error]', error)); });
      next();
    } catch (error) {
      if (finishRequest) await finishRequest(false).catch((commitError) => console.error('[Database Release Error]', commitError));
      console.error('[Database Unavailable]', error);
      return res.status(503).json({ error: 'Campus data is temporarily unavailable. Please contact your campus administrator or try again later.', code: 'DATABASE_UNAVAILABLE' });
    }
  });
}

export function broadcastEvent(event: { type: string; payload: any }) {
  const message = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    version: '1.0.0',
    database: process.env.DATABASE_URL ? 'postgresql' : 'local-development',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api', accessPolicy);
app.use('/api/users', usersRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/parents', parentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/spotlight', spotlightRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/transport', transportRoutes);

app.use('/api', (_req, res) => { res.status(404).json({ error: 'API endpoint not found.' }); });

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body exceeds the 3 MB limit.' });
  res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
});

export async function startServer() {
  if (!process.env.DATABASE_URL) {
    initDatabase();
    if (!production) await seedDatabase();
    applySharedPortalAccounts(initDatabase(), readSharedPortalConfig());
  }
  const server = http.createServer(app);
  // Realtime events contain institutional information and require authentication.
  // HTTP refresh remains the production update path until authenticated WS is configured.
  server.listen(PORT, () => console.log(`CampusOS API listening on http://localhost:${PORT}`));
  return server;
}
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer().catch(error => { console.error('[Startup Error]', error); process.exitCode = 1; });
}

export default app;
