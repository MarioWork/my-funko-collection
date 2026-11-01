import type { MergeFieldRow } from '../mergeSubmissionDialogUtils';

type Props = {
  rows: MergeFieldRow[];
};

type RowProps = {
  row: MergeFieldRow;
};

const TITLE = 'Same on both';

function MergeSameField({ row }: RowProps) {
  return (
    <div className="contents">
      <dt className="text-muted-foreground">{row.label}</dt>
      <dd className="break-all">{row.originalValue}</dd>
    </div>
  );
}

// The fields the two funkos already agree on: shown once, nothing to pick.
function MergeSameFields({ rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-medium">{TITLE}</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map((row) => (
          <MergeSameField key={row.field} row={row} />
        ))}
      </dl>
    </section>
  );
}

export default MergeSameFields;
