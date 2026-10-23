import { useFetcher } from 'react-router';
import type { CollectionApiModel, CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { useActionToast } from '@hooks/useActionToast';
import { createFormData } from '@utils/formDataUtils';

type Options = {
  funko: FunkoDetailApiModel;
  items: CollectionItemApiModel[];
};

const COLLECTION_ID_FIELD = 'collectionId';

// The saved memberships with the change in flight already applied, so a toggle flips the moment it is pressed. If
// the write fails, the fetcher drops its form data and the saved set shows again.
function optimisticMemberIds(savedIds: Set<number>, pendingFormData: FormData | undefined, method: string | undefined) {
  const pendingId = pendingFormData?.get(COLLECTION_ID_FIELD);

  if (!pendingId) return savedIds;

  const memberIds = new Set(savedIds);
  const collectionId = Number(pendingId);

  if (method === HttpVerbsUtil.DELETE) {
    memberIds.delete(collectionId);

    return memberIds;
  }

  memberIds.add(collectionId);

  return memberIds;
}

// Which collections the funko is in, and one write that adds it to or removes it from one: the Owned / Wishlist
// toggles and the Lists menu both use it. Each caller owns its fetcher, so each shows its own busy state. The
// membership shows as changed at once (optimistic), not after the server answers.
export function useFunkoMemberships({ funko, items }: Options) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const membershipPath = FUNKO_ROUTES_PATHS.membership(String(funko.id));
  const savedIds = new Set(items.map((item) => item.collection.id));
  const memberIds = optimisticMemberIds(savedIds, fetcher.formData, fetcher.formMethod);

  const toggle = (collection: CollectionApiModel) => {
    const isMember = memberIds.has(collection.id);

    void fetcher.submit(createFormData({ [COLLECTION_ID_FIELD]: collection.id }), {
      method: isMember ? HttpVerbsUtil.DELETE : HttpVerbsUtil.POST,
      action: membershipPath,
    });
  };

  useActionToast(fetcher, {
    successMessage: () =>
      fetcher.formMethod === HttpVerbsUtil.DELETE ? 'Removed from the collection' : 'Added to the collection',
  });

  return { memberIds, isBusy: fetcher.state !== 'idle', toggle };
}
