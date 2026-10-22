import getSuggestionsHandler from './getSuggestions.mock.handler';

export const suggestMockHandlers = (baseUrl: string) => [...getSuggestionsHandler(baseUrl)];
