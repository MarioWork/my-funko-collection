import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { SeriesApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import seriesService from '@services/seriesService/seriesService';
import { CreateSeriesSchema } from '@services/seriesService/seriesService.type';
import { parseFormData } from '@utils/formDataUtils';

export const createSeriesAction = async ({
  request,
}: ActionFunctionArgs): Promise<JSONResponseUtil<SeriesApiModel>> => {
  const { entity } = parseFormData<ManageEntityFormData>(await request.formData());

  try {
    const valid = await CreateSeriesSchema.validate({ name: entity.name });

    return await seriesService.addSeries(valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
