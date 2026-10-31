import type { ActionFunctionArgs } from 'react-router';
import type { SeriesApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import type { ManageEntityFormData } from '@components/ManageForm';
import seriesService from '@services/seriesService/seriesService';
import { UpdateSeriesSchema } from '@services/seriesService/seriesService.type';
import { parseFormData } from '@utils/formDataUtils';
import { actionForVerbs, failWhenInvalid, type VerbActionMap } from '@utils/actionUtils';

const updateSeriesAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<SeriesApiModel>> => {
  const { entity } = parseFormData<ManageEntityFormData>(await request.formData());

  return failWhenInvalid(async () => {
    const valid = await UpdateSeriesSchema.validate({ name: entity.name });

    return seriesService.updateSeries(Number(params.seriesId), valid);
  });
};

const deleteSeriesAction = async ({ params }: ActionFunctionArgs): Promise<JSONResponseUtil> =>
  seriesService.deleteSeries(Number(params.seriesId));

const SERIES_ACTION_MAP: VerbActionMap = {
  [HttpVerbsUtil.PATCH]: updateSeriesAction,
  [HttpVerbsUtil.DELETE]: deleteSeriesAction,
};

// One path, two verbs: PATCH renames, DELETE removes.
export const seriesAction = actionForVerbs(SERIES_ACTION_MAP);
