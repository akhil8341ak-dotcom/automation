import { Workflow, NODE_CATALOG } from '@creatorflow/shared';
import { DependencyGraph } from './graph.js';

export interface WorkflowValidationIssue {
  type: 'error' | 'warning';
  nodeId?: string;
  field?: string;
  message: string;
}

export interface WorkflowValidationResult {
  valid: boolean;
  issues: WorkflowValidationIssue[];
}

export class WorkflowValidator {
  public static validate(workflow: Workflow): WorkflowValidationResult {
    const issues: WorkflowValidationIssue[] = [];

    if (!workflow.nodes || workflow.nodes.length === 0) {
      issues.push({
        type: 'error',
        message: 'Workflow contains no nodes. Add at least one trigger node.',
      });
      return { valid: false, issues };
    }

    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    if (nodeIds.size !== workflow.nodes.length) {
      issues.push({
        type: 'error',
        message: 'Duplicate node IDs detected in workflow.',
      });
    }

    // Check triggers
    const triggerNodes = workflow.nodes.filter(n => n.category === 'triggers' && !n.disabled);
    if (triggerNodes.length === 0) {
      issues.push({
        type: 'error',
        message: 'Workflow has no active trigger node (e.g., Manual Trigger, Schedule, or Webhook).',
      });
    }

    // Validate edges
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.source)) {
        issues.push({
          type: 'error',
          message: `Edge ${edge.id} references non-existent source node "${edge.source}".`,
        });
      }
      if (!nodeIds.has(edge.target)) {
        issues.push({
          type: 'error',
          message: `Edge ${edge.id} references non-existent target node "${edge.target}".`,
        });
      }
    }

    // Validate node configs against catalog
    for (const node of workflow.nodes) {
      const meta = NODE_CATALOG[node.type];
      if (!meta) {
        issues.push({
          type: 'warning',
          nodeId: node.id,
          message: `Node type "${node.type}" is not in the standard catalog. Custom executor will be needed.`,
        });
      }
    }

    // Cycle check
    try {
      const graph = new DependencyGraph(workflow);
      graph.getTopologicalOrder();
    } catch (err: any) {
      issues.push({
        type: 'error',
        message: err.message || 'Workflow contains an invalid cycle/loop.',
      });
    }

    const hasErrors = issues.some(i => i.type === 'error');
    return {
      valid: !hasErrors,
      issues,
    };
  }
}
