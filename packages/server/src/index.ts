import express, { Request, Response } from 'express';
import cors from 'cors';
import * as path from 'node:path';
import * as fs from 'node:fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { Database } from './db/index.js';
import { WorkflowEngine, WorkflowScheduler } from '@creatorflow/engine';
import { SseManager } from './events/sse.js';

import { createWorkflowRouter } from './routes/workflows.js';
import { createExecutionRouter } from './routes/executions.js';
import { createApprovalRouter } from './routes/approvals.js';
import { createStudioRouter } from './routes/studio.js';
import { createChannelRouter } from './routes/channels.js';
import { createAnalyticsRouter } from './routes/analytics.js';
import { createTemplatesRouter } from './routes/templates.js';
import { createSettingsRouter } from './routes/settings.js';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);
const host = process.env.HOST || '0.0.0.0';

// Ensure media storage directories exist
const storageBaseDir = path.resolve(process.env.STORAGE_PATH || './data/storage');
const mediaDirs = ['audio', 'assets', 'renders', 'temp', 'thumbnails', 'executions'];
for (const dir of mediaDirs) {
  const fullPath = path.join(storageBaseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

// Initialize database and workflow engine
const db = new Database();
const engine = new WorkflowEngine(process.env);
const scheduler = new WorkflowScheduler(engine);
const sse = new SseManager();

// Wire engine events to SSE broadcaster and persistent database
engine.on('execution:started', (record) => {
  db.saveExecution(record);
  sse.broadcast('execution:started', record);
});

engine.on('node:started', (payload) => {
  sse.broadcast('node:started', payload);
});

engine.on('node:completed', (payload) => {
  const rec = engine.getActiveExecution(payload.executionId);
  if (rec) db.saveExecution(rec);
  sse.broadcast('node:completed', payload);
});

engine.on('node:failed', (payload) => {
  const rec = engine.getActiveExecution(payload.executionId);
  if (rec) db.saveExecution(rec);
  sse.broadcast('node:failed', payload);
});

engine.on('node:paused', (payload) => {
  sse.broadcast('node:paused', payload);
});

engine.on('execution:paused', ({ executionId, gateId, gate }) => {
  const rec = engine.getActiveExecution(executionId);
  if (rec) db.saveExecution(rec);
  db.saveApprovalGate(gate);
  sse.broadcast('execution:paused', { executionId, gateId, gate });
});

engine.on('execution:resumed', (payload) => {
  const rec = engine.getActiveExecution(payload.executionId);
  if (rec) db.saveExecution(rec);
  sse.broadcast('execution:resumed', payload);
});

engine.on('execution:completed', (record) => {
  db.saveExecution(record);
  sse.broadcast('execution:completed', record);
});

engine.on('execution:failed', (record) => {
  db.saveExecution(record);
  sse.broadcast('execution:failed', record);
});

// Register existing active scheduled workflows
const workflows = db.getWorkflows();
for (const wf of workflows) {
  scheduler.registerWorkflow(wf);
}
scheduler.start(60000);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Static Media File Serving
app.use('/media', express.static(storageBaseDir));

// SSE Event Stream
app.get('/api/events', (req: Request, res: Response) => {
  sse.addClient(res);
});

// API Routes
app.use('/api/workflows', createWorkflowRouter(db, engine));
app.use('/api/executions', createExecutionRouter(db, engine));
app.use('/api/approvals', createApprovalRouter(db, engine));
app.use('/api/studio', createStudioRouter(db, engine, storageBaseDir));
app.use('/api/channels', createChannelRouter(db));
app.use('/api/analytics', createAnalyticsRouter(db, engine));
app.use('/api/templates', createTemplatesRouter(db));
app.use('/api/settings', createSettingsRouter(engine));

// Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSec: process.uptime(),
    activeExecutions: engine.getPendingApprovalGates().length,
  });
});

// Serve frontend distribution if built
const clientDistPath = path.resolve(process.cwd(), 'packages/client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Server]: Serving web frontend from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/media')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(port, host, () => {
  console.log(`================================================================`);
  console.log(`🚀 CreatorFlow AI Server running at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
  console.log(`📁 Media Storage: ${storageBaseDir}`);
  console.log(`⚡ Live Event Stream: http://localhost:${port}/api/events`);
  console.log(`================================================================`);
});

export { app, db, engine, scheduler };
