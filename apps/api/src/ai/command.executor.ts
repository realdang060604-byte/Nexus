import {
  NexusCommand
} from './command.types';

import {
  getTool
} from '../tools/tool.registry';

import {
  NexusToolContext,
  NexusToolResult
} from '../tools/tool.types';

export interface CommandExecutionResult
  extends NexusToolResult {}

/* ==========================================
   EXECUTE COMMAND
========================================== */

export const executeCommand = async (
  command: NexusCommand,
  context: NexusToolContext
): Promise<CommandExecutionResult> => {

  /* ======================================
     UNKNOWN
  ====================================== */

  if (
    command.intent ===
    'UNKNOWN'
  ) {
    return {
      action:
        'UNKNOWN',

      message:
        'NEXUS chưa hiểu yêu cầu này.'
    };
  }

  /* ======================================
     FIND TOOL
  ====================================== */

  const tool =
    getTool(
      command.intent
    );

  if (!tool) {
    console.error(
      '❌ Tool not found:',
      command.intent
    );

    return {
      action:
        command.intent,

      message:
        `NEXUS chưa có công cụ để xử lý yêu cầu "${command.intent}".`
    };
  }

  /* ======================================
     EXECUTE TOOL
  ====================================== */

  const result =
    await tool.execute(
      command.arguments,
      context
    );

  console.log(
    '🛠️ TOOL EXECUTED:',
    tool.name
  );

  return result;
};
