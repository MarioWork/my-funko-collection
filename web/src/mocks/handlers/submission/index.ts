import listSubmissionsHandler from './listSubmissions.mock.handler';

export const submissionMockHandlers = (baseUrl: string) => [...listSubmissionsHandler(baseUrl)];
