import { Router, Request, Response } from 'express';
import { Database } from '../db/index.js';
import { ChannelConfig } from '@creatorflow/shared';

export function createChannelRouter(db: Database): Router {
  const router = Router();

  // GET /api/channels - Get active channel settings
  router.get('/', (req: Request, res: Response) => {
    try {
      const channel = db.getChannel();
      res.json(channel);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/channels - Update channel settings
  router.put('/', (req: Request, res: Response) => {
    try {
      const existing = db.getChannel() || { id: 'channel_primary' };
      const updated: ChannelConfig = {
        ...existing,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      db.saveChannel(updated);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
