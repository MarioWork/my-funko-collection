import getStatsHandler from './getStats.mock.handler';

export const statsMockHandlers = (baseUrl: string) => [...getStatsHandler(baseUrl)];
