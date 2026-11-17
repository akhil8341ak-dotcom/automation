import { Router, Request, Response } from 'express';
import { Database } from '../db/index.js';
import { WORKFLOW_TEMPLATES, Workflow } from '@creatorflow/shared';

export function createTemplatesRouter(db: Database): Router {
  const router = Router();

  // GET /api/templates - List all built-in templates
  router.get('/', (req: Request, res: Response) => {
    res.json(WORKFLOW_TEMPLATES);
  });

  // POST /api/templates/:id/instantiate - Create a fresh editable workflow from template
  router.post('/:id/instantiate', (req: Request, res: Response) => {
    try {
      const template = WORKFLOW_TEMPLATES.find(t => t.id === req.params.id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const newId = `wf-${Date.now()}`;
      const instantiated: Workflow = {
        ...template,
        id: newId,
        name: req.body.name || `${template.name} (Customized)`,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.saveWorkflow(instantiated);
      res.status(201).json(instantiated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
