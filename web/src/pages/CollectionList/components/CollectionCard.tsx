import { MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useFetcher } from 'react-router';
import type { CollectionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { COLLECTION_ROUTES_PATHS } from '@application/routes/routesUtils';
import ConfirmDialog from '@components/ConfirmDialog';
import IconButton from '@components/IconButton';
import { Badge } from '@components/ui/badge';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { useActionToast } from '@hooks/useActionToast';
import { formatCents } from '@utils/moneyUtils';

type Props = {
  collection: CollectionApiModel;
};

type MenuProps = {
  collection: CollectionApiModel;
  isBusy: boolean;
  onMakeDefault: () => void;
  onDelete: () => void;
};

const DELETE_HINT_ID = 'collection-delete-hint';

function CollectionMenu({ collection, isBusy, onMakeDefault, onDelete }: MenuProps) {
  const id = String(collection.id);

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuGroup>
        <DropdownMenuItem render={<Link to={COLLECTION_ROUTES_PATHS.edit(id)} />}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem disabled={collection.isDefault || isBusy} onClick={onMakeDefault}>
          <Star aria-hidden="true" fill={collection.isDefault ? 'currentColor' : 'none'} />
          {collection.isDefault ? 'Default' : 'Make default'}
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {collection.isDefault ? (
          // A disabled item swallows pointer events, so the tooltip hangs on a wrapper around it.
          <Tooltip>
            <TooltipTrigger render={<span className="block" />}>
              <DropdownMenuItem variant="destructive" disabled aria-describedby={DELETE_HINT_ID}>
                <Trash2 aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent id={DELETE_HINT_ID} side="left">
              The default collection cannot be deleted. Make another one the default first.
            </TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuItem variant="destructive" disabled={isBusy} onClick={onDelete}>
            <Trash2 aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}

// Name, default star, counts and money spent; the card links to the collection's items.
function CollectionCard({ collection }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const id = String(collection.id);
  const isBusy = fetcher.state !== 'idle';

  const makeDefault = () =>
    void fetcher.submit(null, { method: HttpVerbsUtil.POST, action: COLLECTION_ROUTES_PATHS.setDefault(id) });
  const remove = () =>
    void fetcher.submit(null, { method: HttpVerbsUtil.DELETE, action: COLLECTION_ROUTES_PATHS.delete(id) });

  useActionToast(fetcher, {
    successMessage: () =>
      fetcher.formMethod === HttpVerbsUtil.DELETE
        ? `Deleted ${collection.name}`
        : `${collection.name} is now the default`,
  });

  return (
    <li>
      <Card className="relative h-full transition-[transform,box-shadow,border-color] duration-200 focus-within:border-primary/40 hover:border-primary/40 hover:shadow-md motion-safe:hover:-translate-y-0.5">
        <CardHeader>
          <CardTitle>
            <Link
              to={COLLECTION_ROUTES_PATHS.detail(id)}
              className="outline-none after:absolute after:inset-0 after:rounded-xl"
            >
              {collection.name}
            </Link>
            {collection.isDefault ? <Badge className="ml-2 align-middle">Default</Badge> : null}
          </CardTitle>
          <CardDescription>{collection.notes ?? 'No notes'}</CardDescription>
          <CardAction className="relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<IconButton aria-label={`Actions for ${collection.name}`} variant="ghost" />}
              >
                <MoreHorizontal aria-hidden="true" />
              </DropdownMenuTrigger>
              <CollectionMenu
                collection={collection}
                isBusy={isBusy}
                onMakeDefault={makeDefault}
                onDelete={() => setIsDeleteOpen(true)}
              />
            </DropdownMenu>
          </CardAction>
        </CardHeader>
        <CardContent className="flex gap-4 text-sm tabular-nums">
          <span>
            <strong>{collection.itemCount}</strong> funkos
          </span>
          <span>
            <strong>{collection.totalQuantity}</strong> pieces
          </span>
          <span>
            <strong>{formatCents(collection.totalSpentCents)}</strong> spent
          </span>
        </CardContent>
      </Card>
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={`Delete ${collection.name}?`}
        description="Its items are removed from this list. The funkos themselves stay in your catalog."
        confirmLabel="Delete"
        isDestructive
        isPending={isBusy}
        onConfirm={() => {
          setIsDeleteOpen(false);
          remove();
        }}
        onClose={() => setIsDeleteOpen(false)}
      />
    </li>
  );
}

export default CollectionCard;
