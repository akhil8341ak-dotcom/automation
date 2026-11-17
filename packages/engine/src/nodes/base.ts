import { ExecutionContext, NodeOutputResult } from '../execution/context.js';

export abstract class NodeExecutor {
  abstract execute(ctx: ExecutionContext): Promise<NodeOutputResult>;
}
