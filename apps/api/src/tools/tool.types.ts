export interface NexusToolResult {
  success?: boolean;
  action: string;
  message: string;
  data?: unknown;
}

export interface NexusToolContext {
  userId: string;
  channel: 'WEB' | 'TELEGRAM';
}

export interface NexusTool<TInput = unknown> {
  name: string;
  description: string;

  execute(
    input: TInput,
    context: NexusToolContext
  ): Promise<NexusToolResult>;
}
