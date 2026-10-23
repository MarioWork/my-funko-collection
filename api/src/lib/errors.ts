type AppErrorOptions = {
  code: string;
  isOperational?: boolean;
  cause?: unknown;
};

// The base of every error the app throws on purpose. `code` is stable for callers; `message` is for humans.
export class AppError extends Error {
  readonly code: string;
  readonly isOperational: boolean;

  constructor(message: string, options: AppErrorOptions) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.isOperational = options.isOperational ?? true;
  }
}

// A state the code should never reach (a row missing right after its insert). Not operational: the error handler
// answers 500 and logs it in full.
export class InternalError extends AppError {
  constructor(message: string) {
    super(message, { code: 'INTERNAL_ERROR', isOperational: false });
  }
}
