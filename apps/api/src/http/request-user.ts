import { Request } from 'express';

const DEFAULT_WEB_USER_ID = 'web-local-user';

export const getRequestUserId = (
  req: Request
): string => {
  const headerUserId = req.header('x-user-id');

  if (headerUserId?.trim()) {
    return headerUserId.trim();
  }

  return DEFAULT_WEB_USER_ID;
};
