import type { ActionFunctionArgs } from 'react-router';
import type { SeriesApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import seriesService from '@services/seriesService/seriesService';
import { CreateSeriesSchema } from '@services/seriesService/seriesService.type';
import { parseFormData } from '@utils/formDataUtils';
import { failWhenInvalid } from '@utils/actionUtils';

export const createSeriesAction = async ({
  request,
}: ActionFunctionArgs): Promise<JSONResponseUtil<SeriesApiModel>> => {
  const { entity } = parseFormData<ManageEntityFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const valid = await CreateSeriesSchema.validate({ name: entity.name });

    return seriesService.addSeries(valid);
  });
};
