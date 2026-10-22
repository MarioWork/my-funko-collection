import { Check, ListChecks, Pencil, Star, Trash2 } from 'lucide-react';
import { useFetcher } from 'react-router';
import type { CollectionApiModel, CollectionItemApiModel, FunkoDetailApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import LinkButton from '@components/LinkButton';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { useActionToast } from '@hooks/useActionToast';
import { createFormData } from '@utils/formDataUtils';

type Props = {
  funko: FunkoDetailApiModel;
  collections: CollectionApiModel[];
  items: CollectionItemApiModel[];
  onDelete: () => void;
};

type ListsMenuProps = {
  collections: CollectionApiModel[];
  memberIds: Set<number>;
  isBusy: boolean;
  onToggle: (collection: CollectionApiModel) => void;
};

// Stacked icon + label on phones, inline on wider panes.
const ACTION_CLASS = 'h-11 flex-col gap-0.5 text-xs @md:h-9 @md:flex-row @md:gap-1.5 @md:text-sm';

function ListsMenu({ collections, memberIds, isBusy, onToggle }: ListsMenuProps) {
  return (
    <DropdownMenuContent>
      <DropdownMenuGroup>
        {collections.map((collection) => (
          <DropdownMenuCheckboxItem
            key={collection.id}
            checked={memberIds.has(collection.id)}
            disabled={isBusy}
            onCheckedChange={() => onToggle(collection)}
          >
            {collection.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

// Four equal buttons on every detail page: the default collection toggle, the other lists, edit, delete.
function FunkoActionRow({ funko, collections, items, onDelete }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const membershipPath = FUNKO_ROUTES_PATHS.membership(String(funko.id));
  const defaultCollection = collections.find((collection) => collection.isDefault);
  const memberIds = new Set(items.map((item) => item.collection.id));
  const isBusy = fetcher.state !== 'idle';
  const isInDefault = defaultCollection ? memberIds.has(defaultCollection.id) : false;

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

  return (
    <div className="grid grid-cols-4 gap-2">
      {defaultCollection ? (
        <Button
          variant={isInDefault ? 'default' : 'outline'}
          aria-pressed={isInDefault}
          disabled={isBusy}
          onClick={() => toggle(defaultCollection)}
          className={ACTION_CLASS}
        >
          {isInDefault ? <Check aria-hidden="true" /> : <Star aria-hidden="true" />}
          {defaultCollection.name}
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className={ACTION_CLASS} />}>
          <ListChecks aria-hidden="true" />
          Lists
        </DropdownMenuTrigger>
        <ListsMenu collections={collections} memberIds={memberIds} isBusy={isBusy} onToggle={toggle} />
      </DropdownMenu>
      <LinkButton to={FUNKO_ROUTES_PATHS.edit(String(funko.id))} variant="outline" className={ACTION_CLASS}>
        <Pencil aria-hidden="true" />
        Edit
      </LinkButton>
      <Button variant="outline" className={ACTION_CLASS} onClick={onDelete}>
        <Trash2 aria-hidden="true" />
        Delete
      </Button>
    </div>
  );
}

export default FunkoActionRow;
