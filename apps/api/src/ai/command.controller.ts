import {
  Request,
  Response
} from 'express';

import {
  routeCommand
} from './command.router';

import {
  processNexusMessage
} from '../core/nexus.core';

import { getRequestUserId } from '../http/request-user';

/* ==========================================
   ANALYZE COMMAND
========================================== */

export const analyzeCommandController = async (
  req: Request,
  res: Response
) => {
  try {
    const { message } = req.body;

    if (
      !message ||
      typeof message !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message: 'Message is required'
      });

      return;
    }

    const cleanMessage =
      message.trim();

    if (!cleanMessage) {
      res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });

      return;
    }

    const command =
      await routeCommand(
        cleanMessage
      );

    res.status(200).json({
      success: true,
      data: command
    });

  } catch (error) {
    console.error(
      '❌ AI command analysis error:',
      error
    );

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to analyze command'
    });
  }
};

/* ==========================================
   EXECUTE COMMAND
========================================== */

export const executeCommandController = async (
  req: Request,
  res: Response
) => {
  try {
      const {
      message
    } = req.body;

    if (
      !message ||
      typeof message !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message: 'Message is required'
      });

      return;
    }

    const cleanMessage =
      message.trim();

    if (!cleanMessage) {
      res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });

      return;
    }

    const cleanUserId = getRequestUserId(req);

    const result =
      await processNexusMessage({
        userId:
          cleanUserId,

        channel:
          'WEB',

        message:
          cleanMessage
      });

    res.status(200).json({
      success:
        result.success,

      requiresConfirmation:
        result.requiresConfirmation,

      command:
        result.command,

      result: {
        action:
          result.execution?.action ||
          result.command.intent,

        data:
          result.execution?.data,

        message:
          result.reply
      }
    });

  } catch (error) {
    console.error(
      '❌ NEXUS WEB processing error:',
      error
    );

    res.status(500).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : 'Failed to execute command'
    });
  }
};
