import addSeriesHandler from './addSeries.mock.handler';
import deleteSeriesHandler from './deleteSeries.mock.handler';
import listSeriesHandler from './listSeries.mock.handler';
import updateSeriesHandler from './updateSeries.mock.handler';

export const seriesMockHandlers = (baseUrl: string) => [
  ...listSeriesHandler(baseUrl),
  ...addSeriesHandler(baseUrl),
  ...updateSeriesHandler(baseUrl),
  ...deleteSeriesHandler(baseUrl),
];
