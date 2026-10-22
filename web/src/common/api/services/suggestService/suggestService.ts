import axios from 'axios';
import type { SuggestApiModel } from '@app-types/models';

const BASE_SUGGEST_URL = '/suggest';
export const SUGGEST_QUERY_PARAM = 'q';

export default {
  getSuggestions: async (query: string): Promise<SuggestApiModel> => {
    const response = await axios.get<SuggestApiModel>(BASE_SUGGEST_URL, { params: { [SUGGEST_QUERY_PARAM]: query } });

    return response.data;
  },
};
