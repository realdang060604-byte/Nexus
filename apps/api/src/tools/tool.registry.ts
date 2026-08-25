import {
  NexusTool
} from './tool.types';

import {
  cancelTaskTool,
  completeTaskTool,
  createTaskTool,
  listTasksTool
} from './task.tools';

import {
  financeSummaryTool,
  monthlyFinanceSummaryTool,
  recentTransactionsTool,
  recordExpenseTool,
  recordIncomeTool,
  recordSavingTool,
  todayExpenseTool,
  undoLastTransactionTool
} from './finance.tools';

import {
  createCalendarEventTool,
  listCalendarEventsTool
} from './calendar.tools';

import { dailyBriefingTool } from './briefing.tools';

/* ==========================================
   TOOL REGISTRY
========================================== */

const tools =
  new Map<string, NexusTool<any>>();

/* ==========================================
   REGISTER TOOL
========================================== */

export const registerTool = (
  tool: NexusTool<any>
): void => {
  tools.set(
    tool.name,
    tool
  );
};

/* ==========================================
   GET TOOL
========================================== */

export const getTool = (
  name: string
): NexusTool<any> | undefined => {
  return tools.get(name);
};

/* ==========================================
   LIST TOOLS
========================================== */

export const listTools = () => {
  return Array.from(
    tools.values()
  ).map(tool => ({
    name:
      tool.name,

    description:
      tool.description
  }));
};

/* ==========================================
   DEFAULT TOOLS
========================================== */

registerTool(
  createTaskTool
);

registerTool(
  listTasksTool
);

registerTool(
  completeTaskTool
);

registerTool(
  cancelTaskTool
);

registerTool(
  recordExpenseTool
);

registerTool(
  recordIncomeTool
);

registerTool(
  recordSavingTool
);

registerTool(
  financeSummaryTool
);

registerTool(
  todayExpenseTool
);

registerTool(
  recentTransactionsTool
);

registerTool(
  monthlyFinanceSummaryTool
);

registerTool(
  undoLastTransactionTool
);

registerTool(
  createCalendarEventTool
);

registerTool(
  listCalendarEventsTool
);

registerTool(
  dailyBriefingTool
);
