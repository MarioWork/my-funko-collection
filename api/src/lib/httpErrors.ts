import { AppError } from './errors.ts';

type HttpErrorOptions = { code: string; statusCode: number; cause?: unknown };

// An AppError the HTTP error handler can answer directly: its status and `{ code, message }` go to the client.
export class HttpError extends AppError {
  readonly statusCode: number;

  constructor(message: string, options: HttpErrorOptions) {
    super(message, { code: options.code, cause: options.cause });
    this.statusCode = options.statusCode;
  }
}

export class NotFoundError extends HttpError {
  constructor(entity: string, id: string | number) {
    super(`${entity} ${id} not found`, { code: 'NOT_FOUND', statusCode: 404 });
  }
}

// `existingId` points the client at the record that already holds the value (a duplicate funko, a used barcode).
export class ConflictError extends HttpError {
  readonly existingId: number | undefined;

  constructor(message: string, existingId?: number) {
    super(message, { code: 'CONFLICT', statusCode: 409 });
    this.existingId = existingId;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, { code: 'VALIDATION_ERROR', statusCode: 400, cause: options.cause });
  }
}

export class PayloadTooLargeError extends HttpError {
  constructor(message: string) {
    super(message, { code: 'PAYLOAD_TOO_LARGE', statusCode: 413 });
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string, options: { code: string; cause?: unknown }) {
    super(message, { code: options.code, statusCode: 503, cause: options.cause });
  }
}
