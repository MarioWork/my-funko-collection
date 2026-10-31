// Every HTTP status the app, its mocks and its tests name. One copy, so a status is never retyped as a number.
export const CREATED_STATUS = 201;
export const NO_CONTENT_STATUS = 204;
export const BAD_REQUEST_STATUS = 400;
export const UNAUTHORIZED_STATUS = 401;
// Also the status a route error carries when a member opens an admin-only page.
export const FORBIDDEN_STATUS = 403;
export const NOT_FOUND_STATUS = 404;
export const CONFLICT_STATUS = 409;
export const TOO_MANY_REQUESTS_STATUS = 429;
export const SERVER_ERROR_STATUS = 500;
