import { Workflow, WorkflowNode, WorkflowEdge } from '@creatorflow/shared';

export interface GraphNode {
  id: string;
  node: WorkflowNode;
  dependencies: string[]; // Node IDs that must execute before this node
  dependents: string[];   // Node IDs that depend on this node
  incomingEdges: WorkflowEdge[];
  outgoingEdges: WorkflowEdge[];
}

export class DependencyGraph {
  public nodes: Map<string, GraphNode> = new Map();
  public edges: WorkflowEdge[] = [];

  constructor(public workflow: Workflow) {
    this.buildGraph();
  }

  private buildGraph(): void {
    for (const node of this.workflow.nodes) {
      this.nodes.set(node.id, {
        id: node.id,
        node,
        dependencies: [],
        dependents: [],
        incomingEdges: [],
        outgoingEdges: [],
      });
    }

    this.edges = this.workflow.edges;

    for (const edge of this.edges) {
      const sourceNode = this.nodes.get(edge.source);
      const targetNode = this.nodes.get(edge.target);

      if (sourceNode && targetNode) {
        if (!sourceNode.dependents.includes(edge.target)) {
          sourceNode.dependents.push(edge.target);
        }
        if (!targetNode.dependencies.includes(edge.source)) {
          targetNode.dependencies.push(edge.source);
        }
        sourceNode.outgoingEdges.push(edge);
        targetNode.incomingEdges.push(edge);
      }
    }
  }

  /**
   * Kahn's algorithm for cycle detection and topological sorting.
   * Returns topological order if valid, throws error if cycle detected.
   */
  public getTopologicalOrder(): string[] {
    const inDegree = new Map<string, number>();
    for (const [id, node] of this.nodes) {
      inDegree.set(id, node.dependencies.length);
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) {
        queue.push(id);
      }
    }

    const order: string[] = [];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      order.push(currentId);

      const graphNode = this.nodes.get(currentId);
      if (graphNode) {
        for (const dependentId of graphNode.dependents) {
          const currentDeg = inDegree.get(dependentId)! - 1;
          inDegree.set(dependentId, currentDeg);
          if (currentDeg === 0) {
            queue.push(dependentId);
          }
        }
      }
    }

    if (order.length !== this.nodes.size) {
      const cycleNodes = Array.from(this.nodes.keys()).filter(id => !order.includes(id));
      throw new Error(`Cycle detected in workflow graph involving nodes: ${cycleNodes.join(', ')}`);
    }

    return order;
  }

  /**
   * Find entry trigger nodes (nodes with 0 dependencies)
   */
  public getStartNodes(): WorkflowNode[] {
    const startNodes: WorkflowNode[] = [];
    for (const [, graphNode] of this.nodes) {
      if (graphNode.dependencies.length === 0 && !graphNode.node.disabled) {
        startNodes.push(graphNode.node);
      }
    }
    return startNodes;
  }

  /**
   * Get downstream edges from a specific node handle (e.g. 'condition-true' or 'case-shorts')
   */
  public getEdgesFromHandle(nodeId: string, handleId?: string): WorkflowEdge[] {
    const graphNode = this.nodes.get(nodeId);
    if (!graphNode) return [];
    if (!handleId) return graphNode.outgoingEdges;
    return graphNode.outgoingEdges.filter(e => !e.sourceHandle || e.sourceHandle === handleId);
  }
}
