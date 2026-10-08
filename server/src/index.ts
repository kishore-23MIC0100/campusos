import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import { authMiddleware } from './middleware/auth.js';

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

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '8mb' }));

const clients = new Set<WebSocket>();

if (!process.env.VERCEL) {
  // Local development keeps the existing JSON-backed database and WebSocket server.
  initDatabase();
  seedDatabase().catch(err => console.error('[Seed Error]', err));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'CampusOS Realtime Event Stream Active' }));
    ws.on('close', () => clients.delete(ws));
  });

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  CampusOS Core Backend API Engine running on :${PORT}`);
    console.log(`  WebSockets active at ws://localhost:${PORT}/ws`);
    console.log(`====================================================`);
  });
} else {
  // Vercel serverless functions have no durable local disk. Serialize each API
  // request through Neon and commit the state before the response is closed.
  app.use('/api', async (req, res, next) => {
    const db = initDatabase();
    let finishRequest: (() => Promise<void>) | null = null;
    try {
      finishRequest = await db.beginRequest();
      if (!db.hasUsers()) await seedDatabase();
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
        void finishRequest!()
          .then(() => originalEnd(...args as Parameters<typeof res.end>))
          .catch((error) => {
            console.error('[Database Commit Error]', error);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              return originalEnd(JSON.stringify({ error: 'Could not save CampusOS data. Please retry.' }));
            }
            return originalEnd(...args as Parameters<typeof res.end>);
          });
        return res;
      }) as typeof res.end;
      next();
    } catch (error) {
      if (finishRequest) await finishRequest().catch((commitError) => console.error('[Database Release Error]', commitError));
      next(error);
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
    version: 'CampusOS v4.8 Enterprise',
    database: 'Online (Persisted JSON/SQL)',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
// Staff accounts share the Admin & Staff sign-in screen, but their server-side
// API access is limited to self-service and campus information endpoints.
app.use('/api', (req, res, next) => {
  if (!req.headers.authorization) return next();
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'STAFF') return next();
    const path = req.path.replace(/\/$/, '') || '/';
    const allowed =
      (path === '/leave' && ['GET', 'POST'].includes(req.method)) ||
      (path === '/events' && req.method === 'GET') ||
      (/^\/events\/[^/]+\/rsvp$/.test(path) && req.method === 'POST') ||
      (path.startsWith('/announcements') && req.method === 'GET') ||
      (path.startsWith('/transport') && req.method === 'GET') ||
      (path === '/notifications' && req.method === 'GET') ||
      (path.startsWith('/notifications/') && req.method === 'PUT' && (path.endsWith('/read') || path === '/notifications/read-all'));
    if (!allowed) return res.status(403).json({ error: 'This staff account does not have access to that operation.' });
    next();
  });
});
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

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ error: 'Internal server error. Institutional logs updated.' });
});

export default app;
