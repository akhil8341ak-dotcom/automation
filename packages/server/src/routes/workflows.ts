import { Router, Request, Response } from 'express';
import { Database } from '../db/index.js';
import { WorkflowEngine, WorkflowValidator } from '@creatorflow/engine';
import { Workflow, WorkflowSchema } from '@creatorflow/shared';

export function createWorkflowRouter(db: Database, engine: WorkflowEngine): Router {
  const router = Router();

  // GET /api/workflows - List all workflows
  router.get('/', (req: Request, res: Response) => {
    try {
      const workflows = db.getWorkflows();
      res.json(workflows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/workflows - Create new workflow
  router.post('/', (req: Request, res: Response) => {
    try {
      const parsed = WorkflowSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
      }

      const wf = parsed.data as Workflow;
      db.saveWorkflow(wf);
      res.status(201).json(wf);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/workflows/:id - Get workflow details
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const wf = db.getWorkflow(req.params.id);
      if (!wf) return res.status(404).json({ error: 'Workflow not found' });
      res.json(wf);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/workflows/:id - Update workflow
  router.put('/:id', (req: Request, res: Response) => {
    try {
      const existing = db.getWorkflow(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Workflow not found' });

      const updated: Workflow = {
        ...existing,
        ...req.body,
        id: req.params.id,
        updatedAt: new Date().toISOString(),
      };

      db.saveWorkflow(updated);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/workflows/:id - Delete workflow
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const deleted = db.deleteWorkflow(req.params.id);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/workflows/:id/duplicate - Duplicate workflow
  router.post('/:id/duplicate', (req: Request, res: Response) => {
    try {
      const source = db.getWorkflow(req.params.id);
      if (!source) return res.status(404).json({ error: 'Workflow not found' });

      const newId = `wf-${Date.now()}`;
      const copy: Workflow = {
        ...source,
        id: newId,
        name: `${source.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.saveWorkflow(copy);
      res.status(201).json(copy);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/workflows/:id/validate - Validate workflow structure
  router.post('/:id/validate', (req: Request, res: Response) => {
    try {
      const wf = req.body.nodes ? (req.body as Workflow) : db.getWorkflow(req.params.id);
      if (!wf) return res.status(404).json({ error: 'Workflow not found' });

      const validation = WorkflowValidator.validate(wf);
      res.json(validation);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/workflows/:id/execute - Trigger workflow execution
  router.post('/:id/execute', async (req: Request, res: Response) => {
    try {
      // Allow executing unsaved in-memory workflow or saved database workflow
      const wf = req.body.workflow || db.getWorkflow(req.params.id);
      if (!wf) return res.status(404).json({ error: 'Workflow not found' });

      // Run asynchronously in background and return initial execution record
      const executionPromise = engine.execute(wf, {
        triggerType: req.body.triggerType || 'manual',
        initialInput: req.body.initialInput,
      });

      // Handle persistence when execution state changes
      executionPromise.then(record => {
        db.saveExecution(record);
      }).catch(err => {
        console.error('[Execution Error]:', err.message);
      });

      // Wait 150ms to return immediate active state to frontend
      await new Promise(r => setTimeout(r, 150));
      const active = engine.getActiveExecution(wf.id) || db.getExecutions(1)[0];

      res.status(202).json({
        message: 'Workflow execution initiated',
        execution: active,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
