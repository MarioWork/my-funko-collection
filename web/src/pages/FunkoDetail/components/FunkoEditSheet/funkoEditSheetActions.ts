import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { FunkoApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import funkoService from '@services/funkoService/funkoService';
import { UpdateFunkoSchema, type UpdateFunko } from '@services/funkoService/funkoService.type';
import { parseFormData } from '@utils/formDataUtils';

type UpdateFunkoFormData = { funko: UpdateFunko };

export const updateFunkoAction = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<JSONResponseUtil<FunkoApiModel>> => {
  const { funko } = parseFormData<UpdateFunkoFormData>(await request.formData());

  try {
    const valid = await UpdateFunkoSchema.validate(funko);

    return await funkoService.updateFunko(Number(params.funkoId), valid);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
