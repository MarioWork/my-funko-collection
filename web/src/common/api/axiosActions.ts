import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiError } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';

type ApiErrorBody = Partial<Pick<ApiError, 'code' | 'message' | 'existingId' | 'issues'>>;

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return typeof data === 'object' && data !== null && 'code' in data;
}

// The only place a failed request becomes an ApiError. The API answers { code, message, issues?, existingId? }.
function toApiError(statusCode: number | undefined, data: unknown): ApiError {
  if (!isApiErrorBody(data)) return { statusCode };

  return { statusCode, code: data.code, message: data.message, existingId: data.existingId, issues: data.issues };
}

// Writes go through here: a failed request becomes `{ success: false, error }` and never throws. Anything that is
// not an HTTP failure is a bug and still throws, so it reaches the route error boundary.
export async function axiosActions<T = unknown>(config: AxiosRequestConfig): Promise<JSONResponseUtil<T>> {
  try {
    const response = await axios.request<T>(config);

    return { success: true, data: response.data };
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;

    return { success: false, error: toApiError(error.response?.status, error.response?.data) };
  }
}
