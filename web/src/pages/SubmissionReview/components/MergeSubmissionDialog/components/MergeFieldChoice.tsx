import { Controller, type Control } from 'react-hook-form';
import DisabledReason from '@components/DisabledReason';
import { Field, FieldContent, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '@components/ui/field';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import {
  MERGE_SIDE_LABELS,
  MergeSide,
  type MergeCompareFormValues,
  type MergeFieldRow,
} from '../mergeSubmissionDialogUtils';

type Props = {
  control: Control<MergeCompareFormValues>;
  idPrefix: string;
  row: MergeFieldRow;
  // Why the submission's value cannot be picked (its barcode belongs to another catalogue funko), if so.
  submissionDisabledReason?: string;
};

type OptionProps = {
  id: string;
  side: MergeSide;
  value: string;
  disabledReason?: string;
};

type RadioProps = {
  id: string;
  side: MergeSide;
  disabledReason?: string;
};

type ValueProps = {
  side: MergeSide;
  value: string;
  disabledReason?: string;
};

function isMergeSide(value: unknown): value is MergeSide {
  return value === MergeSide.ORIGINAL || value === MergeSide.SUBMISSION;
}

// The radio of one side; disabled with its reason in a tooltip when that side cannot be picked.
function MergeSideRadio({ id, side, disabledReason }: RadioProps) {
  return (
    <DisabledReason reason={disabledReason} mode="wrapper">
      <RadioGroupItem id={id} value={side} disabled={disabledReason !== undefined} />
    </DisabledReason>
  );
}

// "Original" or "Submission" over its value, and the reason in words when it cannot be picked (a disabled radio
// cannot take keyboard focus for the tooltip).
function MergeSideValue({ side, value, disabledReason }: ValueProps) {
  return (
    <FieldContent>
      <FieldTitle>{MERGE_SIDE_LABELS[side]}</FieldTitle>
      <span className="text-sm break-all">{value}</span>
      {disabledReason ? <span className="text-xs text-muted-foreground">{disabledReason}</span> : null}
    </FieldContent>
  );
}

// One side as a choice card. A side that cannot be picked is disabled and says why.
function MergeSideOption({ id, side, value, disabledReason }: OptionProps) {
  const isDisabled = disabledReason !== undefined;

  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal" data-disabled={isDisabled || undefined}>
        <MergeSideRadio id={id} side={side} disabledReason={disabledReason} />
        <MergeSideValue side={side} value={value} disabledReason={disabledReason} />
      </Field>
    </FieldLabel>
  );
}

// One field that differs between the two funkos: a radio group named after the field, Original (picked to start
// with) or Submission.
function MergeFieldChoice({ control, idPrefix, row, submissionDisabledReason }: Props) {
  const legendId = `${idPrefix}-${row.field}-legend`;

  return (
    <Controller
      control={control}
      name={`sides.${row.field}`}
      render={({ field }) => (
        <FieldSet>
          <FieldLegend id={legendId} variant="label">
            {row.label}
          </FieldLegend>
          <RadioGroup
            aria-labelledby={legendId}
            value={field.value}
            onValueChange={(value) => {
              if (isMergeSide(value)) field.onChange(value);
            }}
            className="sm:grid-cols-2"
          >
            <MergeSideOption
              id={`${idPrefix}-${row.field}-original`}
              side={MergeSide.ORIGINAL}
              value={row.originalValue}
            />
            <MergeSideOption
              id={`${idPrefix}-${row.field}-submission`}
              side={MergeSide.SUBMISSION}
              value={row.submissionValue}
              disabledReason={submissionDisabledReason}
            />
          </RadioGroup>
        </FieldSet>
      )}
    />
  );
}

export default MergeFieldChoice;
