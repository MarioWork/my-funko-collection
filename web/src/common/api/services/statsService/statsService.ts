import axios from 'axios';
import type { StatsApiModel } from '@app-types/models';

const BASE_STATS_URL = '/stats';

export default {
  getStats: async (): Promise<StatsApiModel> => {
    const response = await axios.get<StatsApiModel>(BASE_STATS_URL);

    return response.data;
  },
};
