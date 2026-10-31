import { ChevronRight } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ImageGroupApiModel, ImageListEntryApiModel } from '@app-types/models';
import TableSkeletonRows from '@components/TableSkeletonRows';
import { Table, TableBody, TableCell, TableRow } from '@components/ui/table';
import { formatBytes } from '@utils/byteUtils';
import { cn } from '@utils/classNameUtils';
import { formatDateTime } from '@utils/dateUtils';
import { IMAGE_SKELETON_COLUMNS } from '../imageListUtils';
import ImageTableHead from './ImageTableHead';
import ImageTableRow from './ImageTableRow';

type Props = {
  groups: ImageGroupApiModel[];
  onOpen: (image: ImageListEntryApiModel) => void;
  // The next page is loading: placeholder rows under the last one.
  isLoadingMore?: boolean;
};

type GroupRowProps = {
  group: ImageGroupApiModel;
  isExpanded: boolean;
  onToggle: () => void;
};

const LOOSE_GROUP_TITLE = 'Not being used';

function groupTitle(group: ImageGroupApiModel): string {
  return group.funko ? `${group.funko.name} #${group.funko.number}` : LOOSE_GROUP_TITLE;
}

function imageCountText(count: number): string {
  return count === 1 ? '1 image' : `${count} images`;
}

// A funko's line: name, how many images, their total size and the newest date. The whole row opens or closes it.
function GroupRow({ group, isExpanded, onToggle }: GroupRowProps) {
  return (
    <TableRow className="relative">
      <TableCell className="max-w-0 min-w-48">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className="flex max-w-full items-center gap-2 rounded-sm text-left outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight
            aria-hidden="true"
            className={cn(
              'size-4 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:duration-200',
              isExpanded && 'rotate-90',
            )}
          />
          <span className="truncate font-medium">{groupTitle(group)}</span>
        </button>
        <p className="pl-6 text-xs text-muted-foreground">{imageCountText(group.imageCount)}</p>
      </TableCell>
      <TableCell className="hidden @3xl:table-cell" />
      <TableCell className="whitespace-nowrap tabular-nums">{formatBytes(group.sizeBytes)}</TableCell>
      <TableCell className="hidden whitespace-nowrap tabular-nums @3xl:table-cell">
        {formatDateTime(group.newestCreatedAt)}
      </TableCell>
      <TableCell className="hidden @3xl:table-cell" />
    </TableRow>
  );
}

// One row per funko with its totals; opening a row lists its images under it, each opening its preview.
function ImageGroupTable({ groups, onOpen, isLoadingMore = false }: Props) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    const next = new Set(expandedKeys);

    if (next.has(key)) next.delete(key);
    else next.add(key);

    setExpandedKeys(next);
  };

  return (
    <Table>
      <ImageTableHead firstLabel="Funko" />
      <TableBody>
        {groups.map((group) => {
          const isExpanded = expandedKeys.has(group.key);

          return (
            <Fragment key={group.key}>
              <GroupRow group={group} isExpanded={isExpanded} onToggle={() => toggle(group.key)} />
              {isExpanded
                ? group.images.map((image) => <ImageTableRow key={image.key} image={image} isNested onOpen={onOpen} />)
                : null}
            </Fragment>
          );
        })}
        {isLoadingMore ? <TableSkeletonRows columnClassNames={IMAGE_SKELETON_COLUMNS} /> : null}
      </TableBody>
    </Table>
  );
}

export default ImageGroupTable;
