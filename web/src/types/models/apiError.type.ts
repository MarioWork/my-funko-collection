// The API's error envelope, mapped once in axiosActions. `existingId` comes with a 409 for a duplicate, `userCount`
// (how many users hold it, never who) with a 409 IN_COLLECTIONS.
export type ApiErrorIssue = {
  path: string;
  message: string;
};

export type ApiError = {
  statusCode?: number;
  code?: string;
  message?: string;
  existingId?: number;
  userCount?: number;
  issues?: ApiErrorIssue[];
};
