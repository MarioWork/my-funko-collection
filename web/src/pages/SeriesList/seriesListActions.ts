import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { SeriesApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import seriesService from '@services/seriesService/seriesService';
import { CreateSeriesSchema, UpdateSeriesSchema } from '@services/seriesService/seriesService.type';
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

const updateSeriesAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<SeriesApiModel>> => {
  const { entity } = parseFormData<ManageEntityFormData>(await request.formData());

  try {
    const valid = await UpdateSeriesSchema.validate({ name: entity.name });

    return await seriesService.updateSeries(Number(params.seriesId), valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};

const deleteSeriesAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  seriesService.deleteSeries(Number(params.seriesId));

const SERIES_ACTION_MAP: Record<string, (args: ActionFunctionArgs) => Promise<JSONResponseUtil>> = {
  [HttpVerbsUtil.PATCH]: updateSeriesAction,
  [HttpVerbsUtil.DELETE]: deleteSeriesAction,
};

// One path, two verbs: PATCH renames, DELETE removes.
export const seriesAction = async (args: ActionFunctionArgs): Promise<JSONResponseUtil> => {
  const handler = SERIES_ACTION_MAP[args.request.method];

  if (!handler) return { success: false };

  return handler(args);
};
