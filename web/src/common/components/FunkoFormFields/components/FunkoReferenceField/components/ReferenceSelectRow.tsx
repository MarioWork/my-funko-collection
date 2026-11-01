import type { LucideIcon } from 'lucide-react';
import type { ControllerRenderProps } from 'react-hook-form';
import CreateNamedButton from '@components/CreateNamedButton';
import { NativeSelect, NativeSelectOption } from '@components/ui/native-select';
import { referenceOptionLabel, type FunkoFormValues } from '../../../funkoFormUtils';
import type { ReferenceFieldName, ReferenceRow } from '../types';

type Props = {
  field: ControllerRenderProps<FunkoFormValues, ReferenceFieldName>;
  id: string;
  isInvalid: boolean;
  // The ids of the description and, when there is one, the error.
  describedBy: string;
  placeholder: string;
  rows: ReferenceRow[];
  noun: string;
  icon: LucideIcon;
  createPath: string;
};

// The placeholder option's value: nothing picked yet, which the form refuses.
const NOTHING_PICKED = '';

// The dropdown and the "+" beside it that creates a missing one and picks it as soon as it exists.
function ReferenceSelectRow({ field, id, isInvalid, describedBy, placeholder, rows, noun, icon, createPath }: Props) {
  return (
    <div className="flex gap-2">
      <NativeSelect
        {...field}
        id={id}
        className="flex-1"
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
      >
        <NativeSelectOption value={NOTHING_PICKED}>{placeholder}</NativeSelectOption>
        {rows.map((row) => (
          <NativeSelectOption key={row.id} value={String(row.id)}>
            {referenceOptionLabel(row)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <CreateNamedButton
        icon={icon}
        noun={noun}
        actionPath={createPath}
        onCreated={(created) => field.onChange(String(created.id))}
      />
    </div>
  );
}

export default ReferenceSelectRow;
