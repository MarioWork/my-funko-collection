import type { ApiError } from '@app-types/models';

export type JSONResponseUtil<T = unknown> = {
  success: boolean;
  error?: ApiError;
  data?: T;
};
