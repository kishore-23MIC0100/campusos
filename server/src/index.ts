import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';

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

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Initialize Database & Seed data
initDatabase();
seedDatabase().catch(err => console.error('[Seed Error]', err));

// WebSocket Server for Realtime Alerts
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'CampusOS Realtime Event Stream Active' }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

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

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ error: 'Internal server error. Institutional logs updated.' });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  CampusOS Core Backend API Engine running on :${PORT}`);
  console.log(`  WebSockets active at ws://localhost:${PORT}/ws`);
  console.log(`====================================================`);
});
