// The API's error envelope, mapped once in axiosActions. `existingId` comes with a 409 for a duplicate.
export type ApiErrorIssue = {
  path: string;
  message: string;
};

export type ApiError = {
  statusCode?: number;
  code?: string;
  message?: string;
  existingId?: number;
  issues?: ApiErrorIssue[];
};
