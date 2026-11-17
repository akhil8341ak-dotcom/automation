import { WorkflowEngine } from '../execution/engine.js';
import { Workflow } from '@creatorflow/shared';

export interface ScheduledJob {
  workflowId: string;
  workflow: Workflow;
  cron: string;
  timezone: string;
  lastRunAt?: string;
  nextRunAt?: string;
  active: boolean;
}

export class WorkflowScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private intervalTimer?: NodeJS.Timeout;

  constructor(private engine: WorkflowEngine) {}

  public registerWorkflow(workflow: Workflow): void {
    const scheduleNode = workflow.nodes.find(n => n.type === 'schedule-trigger' && !n.disabled);
    if (!scheduleNode || !workflow.active) {
      this.jobs.delete(workflow.id);
      return;
    }

    const cron = scheduleNode.config.cron || '0 9 * * 1';
    const timezone = scheduleNode.config.timezone || 'UTC';

    this.jobs.set(workflow.id, {
      workflowId: workflow.id,
      workflow,
      cron,
      timezone,
      active: true,
    });
  }

  public unregisterWorkflow(workflowId: string): void {
    this.jobs.delete(workflowId);
  }

  public start(pollIntervalMs = 60000): void {
    if (this.intervalTimer) return;
    this.intervalTimer = setInterval(() => this.checkSchedules(), pollIntervalMs);
  }

  public stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = undefined;
    }
  }

  private async checkSchedules(): Promise<void> {
    const now = new Date();
    for (const [id, job] of this.jobs) {
      if (!job.active) continue;

      if (this.shouldTriggerNow(job.cron, now)) {
        job.lastRunAt = now.toISOString();
        try {
          await this.engine.execute(job.workflow, {
            triggerType: 'schedule',
            initialInput: { scheduledAt: now.toISOString(), cron: job.cron },
          });
        } catch (err: any) {
          console.error(`[Scheduler Error on ${id}]:`, err.message);
        }
      }
    }
  }

  /**
   * Lightweight cron matcher (standard 5-field cron: minute hour dom month dow)
   */
  private shouldTriggerNow(cron: string, date: Date): boolean {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return false;

    const [min, hour, dom, mon, dow] = parts;
    const curMin = date.getMinutes();
    const curHour = date.getHours();
    const curDom = date.getDate();
    const curMon = date.getMonth() + 1;
    const curDow = date.getDay();

    return (
      this.fieldMatches(min, curMin) &&
      this.fieldMatches(hour, curHour) &&
      this.fieldMatches(dom, curDom) &&
      this.fieldMatches(mon, curMon) &&
      this.fieldMatches(dow, curDow)
    );
  }

  private fieldMatches(field: string, val: number): boolean {
    if (field === '*') return true;
    if (field.startsWith('*/')) {
      const step = parseInt(field.slice(2), 10);
      return val % step === 0;
    }
    const nums = field.split(',').map(s => parseInt(s.trim(), 10));
    return nums.includes(val);
  }
}
