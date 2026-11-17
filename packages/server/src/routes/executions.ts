import { Router, Request, Response } from 'express';
import { Database } from '../db/index.js';
import { WorkflowEngine } from '@creatorflow/engine';

export function createExecutionRouter(db: Database, engine: WorkflowEngine): Router {
  const router = Router();

  // GET /api/executions - List recent executions
  router.get('/', (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const list = db.getExecutions(limit);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/executions/:id - Get specific execution record
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const live = engine.getActiveExecution(req.params.id);
      if (live) return res.json(live);

      const record = db.getExecution(req.params.id);
      if (!record) return res.status(404).json({ error: 'Execution record not found' });
      res.json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/executions/:id/cancel - Cancel active execution
  router.post('/:id/cancel', (req: Request, res: Response) => {
    try {
      const cancelled = engine.cancelExecution(req.params.id);
      res.json({ success: cancelled });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
