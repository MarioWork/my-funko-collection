export const HttpVerbsUtil = {
  GET: 'GET',
  POST: 'POST',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  PUT: 'PUT',
} as const;

export type HttpVerbsUtil = (typeof HttpVerbsUtil)[keyof typeof HttpVerbsUtil];
