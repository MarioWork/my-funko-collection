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

// Which collections the funko is in, and one write that adds it to or removes it from one: the Owned / Wishlist
// toggles and the Lists menu both use it. Each caller owns its fetcher, so each shows its own busy state.
export function useFunkoMemberships({ funko, items }: Options) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const membershipPath = FUNKO_ROUTES_PATHS.membership(String(funko.id));
  const memberIds = new Set(items.map((item) => item.collection.id));

  const toggle = (collection: CollectionApiModel) => {
    const isMember = memberIds.has(collection.id);

    void fetcher.submit(createFormData({ collectionId: collection.id }), {
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
