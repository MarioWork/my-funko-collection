import type { ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import type { CollectionItemApiModel, FunkoApiModel } from '@app-types/models';
import type { JSONResponseUtil } from '@app-types/utility';
import collectionItemService, { ItemApiSearchFields } from '@services/collectionItemService/collectionItemService';
import funkoService from '@services/funkoService/funkoService';
import { CreateFunkoSchema, type CreateFunko } from '@services/funkoService/funkoService.type';
import { parseFormData } from '@utils/formDataUtils';
import { AddIntentUtil, incrementSchema } from './addUtils';
import { type AddDestination } from '@utils/addDestinationUtils';

type CreateFormData = {
  intent: typeof AddIntentUtil.CREATE;
  funko: CreateFunko;
  quantity: number;
  destination: AddDestination;
};

type IncrementFormData = {
  intent: typeof AddIntentUtil.INCREMENT;
  funkoId: number;
  collectionId: number;
};

export type AddActionData = JSONResponseUtil<{ funko: FunkoApiModel; item: CollectionItemApiModel | null }>;

// Creates the funko, then files it in the chosen collection with the chosen tags, or stops after the catalog
// when no collection was chosen. The photos follow through the funko's own images action once the funko exists.
async function createAndFile({ funko, quantity, destination }: CreateFormData): Promise<AddActionData> {
  const validFunko = await CreateFunkoSchema.validate(funko);
  const created = await funkoService.addFunko(validFunko);

  if (!created.success || !created.data) return { success: false, error: created.error };

  if (destination.collectionId === null) return { success: true, data: { funko: created.data, item: null } };

  const item = await collectionItemService.addCollectionItem(destination.collectionId, {
    funkoId: created.data.id,
    quantity,
    condition: null,
    purchasePriceCents: null,
    purchaseCurrency: undefined,
    purchasedAt: null,
    notes: null,
    tagIds: destination.tagIds,
  });

  return { success: true, data: { funko: created.data, item: item.data ?? null } };
}

// "+1": a scanned box you already own bumps the quantity instead of creating a duplicate.
async function increment({ funkoId, collectionId }: IncrementFormData): Promise<AddActionData> {
  const valid = await incrementSchema.validate({ funkoId, collectionId });
  const existing = await collectionItemService.getCollectionItems(valid.collectionId, {
    pagination: { page: '1', size: '1' },
    [ItemApiSearchFields.FUNKO_ID]: String(valid.funkoId),
  });
  const item = existing.data[0];
  const funko = await funkoService.getFunko(valid.funkoId);

  if (!item) {
    const added = await collectionItemService.addCollectionItem(valid.collectionId, {
      funkoId: valid.funkoId,
      quantity: 1,
      condition: null,
      purchasePriceCents: null,
      purchaseCurrency: undefined,
      purchasedAt: null,
      notes: null,
      tagIds: [],
    });

    return added.success
      ? { success: true, data: { funko, item: added.data ?? null } }
      : { success: false, error: added.error };
  }

  const updated = await collectionItemService.updateCollectionItem(valid.collectionId, item.id, {
    quantity: item.quantity + 1,
  });

  return updated.success
    ? { success: true, data: { funko, item: updated.data ?? null } }
    : { success: false, error: updated.error };
}

export const addFunkoAction = async ({ request }: ActionFunctionArgs): Promise<AddActionData> => {
  const data = parseFormData<CreateFormData | IncrementFormData>(await request.formData());

  try {
    return data.intent === AddIntentUtil.INCREMENT ? await increment(data) : await createAndFile(data);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
