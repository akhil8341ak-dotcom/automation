import { Router, Request, Response } from 'express';
import { Database } from '../db/index.js';
import { WorkflowEngine } from '@creatorflow/engine';

export function createApprovalRouter(db: Database, engine: WorkflowEngine): Router {
  const router = Router();

  // GET /api/approvals - List pending approval gates
  router.get('/', (req: Request, res: Response) => {
    try {
      const liveGates = engine.getPendingApprovalGates();
      const dbGates = db.getApprovalGates().filter(g => g.status === 'pending');
      
      // Combine unique gates
      const gateMap = new Map();
      for (const g of dbGates) gateMap.set(g.id, g);
      for (const g of liveGates) gateMap.set(g.id, g);

      res.json(Array.from(gateMap.values()));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/approvals/:id/decide - Submit approval or rejection
  router.post('/:id/decide', async (req: Request, res: Response) => {
    try {
      const { decision, feedback } = req.body; // decision: 'approved' | 'rejected'
      if (decision !== 'approved' && decision !== 'rejected') {
        return res.status(400).json({ error: 'Decision must be "approved" or "rejected"' });
      }

      const gate = engine.getApprovalGate(req.params.id) || db.getApprovalGate(req.params.id);
      if (!gate) return res.status(404).json({ error: 'Approval gate not found' });

      // Resume execution in engine
      const updatedRecord = await engine.resumeExecution(gate.executionId, gate.id, decision, feedback);

      gate.status = decision;
      gate.feedback = feedback;
      gate.decidedAt = new Date().toISOString();
      gate.decidedBy = req.body.decidedBy || 'Human Creator';

      db.saveApprovalGate(gate);
      db.saveExecution(updatedRecord);

      res.json({
        success: true,
        gate,
        execution: updatedRecord,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
