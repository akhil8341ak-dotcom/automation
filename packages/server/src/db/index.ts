import { DatabaseSync } from 'node:sqlite';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { 
  Workflow, 
  ExecutionRecord, 
  ApprovalGate, 
  ChannelConfig, 
  WORKFLOW_TEMPLATES 
} from '@creatorflow/shared';

export class Database {
  private db: DatabaseSync;

  constructor(dbPath?: string) {
    const finalPath = dbPath || process.env.SQLITE_DB_PATH || './data/creatorflow.db';
    const dbDir = path.dirname(path.resolve(finalPath));
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new DatabaseSync(path.resolve(finalPath));
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.migrate();
    this.seedDefaults();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        version INTEGER DEFAULT 1,
        category TEXT,
        tags TEXT, -- JSON array
        nodes TEXT NOT NULL, -- JSON array
        edges TEXT NOT NULL, -- JSON array
        active INTEGER DEFAULT 1,
        channel_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        workflow_name TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        duration_ms INTEGER,
        error TEXT,
        node_states TEXT NOT NULL, -- JSON map
        step_logs TEXT NOT NULL, -- JSON array
        current_running_node_ids TEXT, -- JSON array
        paused_at_node_id TEXT,
        approval_gate_id TEXT
      );

      CREATE TABLE IF NOT EXISTS approval_gates (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        workflow_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        payload TEXT NOT NULL, -- JSON
        feedback TEXT,
        created_at TEXT NOT NULL,
        decided_at TEXT,
        decided_by TEXT
      );

      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        handle TEXT,
        niche TEXT NOT NULL,
        target_audience TEXT NOT NULL,
        primary_format TEXT DEFAULT 'both',
        config_data TEXT NOT NULL, -- JSON
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        title TEXT,
        file_path TEXT NOT NULL,
        url TEXT,
        metadata TEXT, -- JSON
        created_at TEXT NOT NULL
      );
    `);
  }

  private seedDefaults(): void {
    // Check if workflows table is empty
    const countStmt = this.db.prepare('SELECT count(*) as count FROM workflows');
    const result: any = countStmt.get();
    if (result && result.count === 0) {
      console.log('[Database]: Seeding initial 10 production workflow templates...');
      const insertStmt = this.db.prepare(`
        INSERT INTO workflows (id, name, description, version, category, tags, nodes, edges, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const tpl of WORKFLOW_TEMPLATES) {
        insertStmt.run(
          tpl.id,
          tpl.name,
          tpl.description,
          tpl.version,
          tpl.category,
          JSON.stringify(tpl.tags),
          JSON.stringify(tpl.nodes),
          JSON.stringify(tpl.edges),
          tpl.active ? 1 : 0,
          tpl.createdAt,
          tpl.updatedAt
        );
      }
    }

    // Seed default channel if not exists
    const channelStmt = this.db.prepare('SELECT count(*) as count FROM channels');
    const chanRes: any = channelStmt.get();
    if (chanRes && chanRes.count === 0) {
      console.log('[Database]: Seeding default channel configuration...');
      const defaultChannel: ChannelConfig = {
        id: 'channel_primary',
        name: 'Autonomous Creator Studio',
        handle: '@AutonomousCreator',
        niche: 'AI Tools & Modern Software Engineering',
        targetAudience: 'Software engineers, tech entrepreneurs, and modern content creators',
        primaryFormat: 'both',
        preferredDurationSec: { shorts: 50, longform: 480 },
        brandVoice: 'Authoritative, engaging, technical yet accessible, punchy pacing',
        brandColors: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#F59E0B',
          background: '#0B0F19',
        },
        targetCadencePerWeek: 4,
        contentRestrictions: ['Get rich quick claims', 'Plagiarized code', 'Unverified benchmarks'],
        defaultCallToAction: 'Subscribe for daily deep dives into autonomous AI systems and developer workflows.',
        defaultTags: ['AI', 'Coding', 'Workflow Automation', 'Open Source', 'Software Architecture'],
        defaultPrivacy: 'private',
        requireApprovalBeforePublish: true,
        aiContentDisclosureDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const insertChan = this.db.prepare(`
        INSERT INTO channels (id, name, handle, niche, target_audience, primary_format, config_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertChan.run(
        defaultChannel.id,
        defaultChannel.name,
        defaultChannel.handle || '',
        defaultChannel.niche,
        defaultChannel.targetAudience,
        defaultChannel.primaryFormat,
        JSON.stringify(defaultChannel),
        defaultChannel.createdAt,
        defaultChannel.updatedAt
      );
    }
  }

  // ================= Workflows =================
  public getWorkflows(): Workflow[] {
    const stmt = this.db.prepare('SELECT * FROM workflows ORDER BY updated_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      version: r.version,
      category: r.category,
      tags: JSON.parse(r.tags || '[]'),
      nodes: JSON.parse(r.nodes),
      edges: JSON.parse(r.edges),
      active: r.active === 1,
      channelId: r.channel_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public getWorkflow(id: string): Workflow | null {
    const stmt = this.db.prepare('SELECT * FROM workflows WHERE id = ?');
    const r: any = stmt.get(id);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      version: r.version,
      category: r.category,
      tags: JSON.parse(r.tags || '[]'),
      nodes: JSON.parse(r.nodes),
      edges: JSON.parse(r.edges),
      active: r.active === 1,
      channelId: r.channel_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public saveWorkflow(wf: Workflow): void {
    const stmt = this.db.prepare(`
      INSERT INTO workflows (id, name, description, version, category, tags, nodes, edges, active, channel_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        version = excluded.version,
        category = excluded.category,
        tags = excluded.tags,
        nodes = excluded.nodes,
        edges = excluded.edges,
        active = excluded.active,
        channel_id = excluded.channel_id,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      wf.id,
      wf.name,
      wf.description,
      wf.version,
      wf.category,
      JSON.stringify(wf.tags || []),
      JSON.stringify(wf.nodes || []),
      JSON.stringify(wf.edges || []),
      wf.active ? 1 : 0,
      wf.channelId || null,
      wf.createdAt,
      new Date().toISOString()
    );
  }

  public deleteWorkflow(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM workflows WHERE id = ?');
    stmt.run(id);
    return true;
  }

  // ================= Executions =================
  public getExecutions(limit = 50): ExecutionRecord[] {
    const stmt = this.db.prepare('SELECT * FROM executions ORDER BY started_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map(r => ({
      id: r.id,
      workflowId: r.workflow_id,
      workflowName: r.workflow_name,
      triggerType: r.trigger_type,
      status: r.status,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      durationMs: r.duration_ms,
      error: r.error,
      nodeStates: JSON.parse(r.node_states || '{}'),
      stepLogs: JSON.parse(r.step_logs || '[]'),
      currentRunningNodeIds: JSON.parse(r.current_running_node_ids || '[]'),
      pausedAtNodeId: r.paused_at_node_id,
      approvalGateId: r.approval_gate_id,
    }));
  }

  public getExecution(id: string): ExecutionRecord | null {
    const stmt = this.db.prepare('SELECT * FROM executions WHERE id = ?');
    const r: any = stmt.get(id);
    if (!r) return null;
    return {
      id: r.id,
      workflowId: r.workflow_id,
      workflowName: r.workflow_name,
      triggerType: r.trigger_type,
      status: r.status,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      durationMs: r.duration_ms,
      error: r.error,
      nodeStates: JSON.parse(r.node_states || '{}'),
      stepLogs: JSON.parse(r.step_logs || '[]'),
      currentRunningNodeIds: JSON.parse(r.current_running_node_ids || '[]'),
      pausedAtNodeId: r.paused_at_node_id,
      approvalGateId: r.approval_gate_id,
    };
  }

  public saveExecution(rec: ExecutionRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO executions (
        id, workflow_id, workflow_name, trigger_type, status, started_at, completed_at, 
        duration_ms, error, node_states, step_logs, current_running_node_ids, paused_at_node_id, approval_gate_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        duration_ms = excluded.duration_ms,
        error = excluded.error,
        node_states = excluded.node_states,
        step_logs = excluded.step_logs,
        current_running_node_ids = excluded.current_running_node_ids,
        paused_at_node_id = excluded.paused_at_node_id,
        approval_gate_id = excluded.approval_gate_id
    `);

    stmt.run(
      rec.id,
      rec.workflowId,
      rec.workflowName,
      rec.triggerType,
      rec.status,
      rec.startedAt,
      rec.completedAt || null,
      rec.durationMs || null,
      rec.error || null,
      JSON.stringify(rec.nodeStates || {}),
      JSON.stringify(rec.stepLogs || []),
      JSON.stringify(rec.currentRunningNodeIds || []),
      rec.pausedAtNodeId || null,
      rec.approvalGateId || null
    );
  }

  // ================= Approval Gates =================
  public getApprovalGates(): ApprovalGate[] {
    const stmt = this.db.prepare('SELECT * FROM approval_gates ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(r => ({
      id: r.id,
      executionId: r.execution_id,
      workflowId: r.workflow_id,
      nodeId: r.node_id,
      title: r.title,
      description: r.description,
      type: r.type,
      status: r.status,
      payload: JSON.parse(r.payload || '{}'),
      feedback: r.feedback,
      createdAt: r.created_at,
      decidedAt: r.decided_at,
      decidedBy: r.decided_by,
    }));
  }

  public getApprovalGate(id: string): ApprovalGate | null {
    const stmt = this.db.prepare('SELECT * FROM approval_gates WHERE id = ?');
    const r: any = stmt.get(id);
    if (!r) return null;
    return {
      id: r.id,
      executionId: r.execution_id,
      workflowId: r.workflow_id,
      nodeId: r.node_id,
      title: r.title,
      description: r.description,
      type: r.type,
      status: r.status,
      payload: JSON.parse(r.payload || '{}'),
      feedback: r.feedback,
      createdAt: r.created_at,
      decidedAt: r.decided_at,
      decidedBy: r.decided_by,
    };
  }

  public saveApprovalGate(gate: ApprovalGate): void {
    const stmt = this.db.prepare(`
      INSERT INTO approval_gates (id, execution_id, workflow_id, node_id, title, description, type, status, payload, feedback, created_at, decided_at, decided_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        feedback = excluded.feedback,
        decided_at = excluded.decided_at,
        decided_by = excluded.decided_by
    `);

    stmt.run(
      gate.id,
      gate.executionId,
      gate.workflowId,
      gate.nodeId,
      gate.title,
      gate.description || '',
      gate.type,
      gate.status,
      JSON.stringify(gate.payload || {}),
      gate.feedback || null,
      gate.createdAt,
      gate.decidedAt || null,
      gate.decidedBy || null
    );
  }

  // ================= Channel Config =================
  public getChannel(): ChannelConfig | null {
    const stmt = this.db.prepare('SELECT config_data FROM channels LIMIT 1');
    const r: any = stmt.get();
    if (!r) return null;
    return JSON.parse(r.config_data);
  }

  public saveChannel(cfg: ChannelConfig): void {
    const stmt = this.db.prepare(`
      INSERT INTO channels (id, name, handle, niche, target_audience, primary_format, config_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        handle = excluded.handle,
        niche = excluded.niche,
        target_audience = excluded.target_audience,
        primary_format = excluded.primary_format,
        config_data = excluded.config_data,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      cfg.id,
      cfg.name,
      cfg.handle || '',
      cfg.niche,
      cfg.targetAudience,
      cfg.primaryFormat,
      JSON.stringify(cfg),
      cfg.createdAt,
      new Date().toISOString()
    );
  }
}
