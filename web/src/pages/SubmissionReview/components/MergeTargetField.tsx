import { Controller, type Control } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@components/ui/field';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { Spinner } from '@components/ui/spinner';
import type { MergeSubmissionFormValues, MergeTarget } from '../submissionReviewUtils';

type Props = {
  control: Control<MergeSubmissionFormValues>;
  idPrefix: string;
  targets: MergeTarget[];
  isSearching: boolean;
  onPick: (target: MergeTarget) => void;
};

type OptionProps = {
  target: MergeTarget;
  idPrefix: string;
};

// The form field's setter for the picked target's id.
type TargetIdChange = (targetFunkoId: string) => void;

const LEGEND = 'Same as';
const NO_TARGETS_NOTE = 'No maybe-double in the catalogue. Search for the funko above.';
const SEARCHING_NOTE = 'Searching…';

function MergeTargetOption({ target, idPrefix }: OptionProps) {
  const id = `${idPrefix}-target-${target.id}`;

  return (
    <Field orientation="horizontal">
      <RadioGroupItem id={id} value={String(target.id)} />
      <FieldLabel htmlFor={id} className="flex flex-col items-start gap-0.5 font-normal">
        <span className="font-medium">
          #{target.number} {target.name}
        </span>
        <span className="text-xs text-muted-foreground">{target.hint}</span>
      </FieldLabel>
    </Field>
  );
}

// One radio per catalogue funko the submission may be the same as. The pick is reported up, so the dialog keeps it
// listed while the admin searches for something else.
function MergeTargetField({ control, idPrefix, targets, isSearching, onPick }: Props) {
  const errorId = `${idPrefix}-target-error`;
  const hasTargets = targets.length > 0;

  const pick = (value: unknown, onChange: TargetIdChange) => {
    const target = targets.find((candidate) => String(candidate.id) === value);

    if (!target) return;

    onChange(String(target.id));
    onPick(target);
  };

  return (
    <Controller
      control={control}
      name="targetFunkoId"
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid || undefined}>
          <FieldLegend variant="label">{LEGEND}</FieldLegend>
          {hasTargets ? (
            <RadioGroup
              value={field.value}
              onValueChange={(value) => pick(value, field.onChange)}
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={fieldState.error ? errorId : undefined}
              className="max-h-64 overflow-y-auto"
            >
              {targets.map((target) => (
                <MergeTargetOption key={target.id} target={target} idPrefix={idPrefix} />
              ))}
            </RadioGroup>
          ) : (
            <FieldDescription>{NO_TARGETS_NOTE}</FieldDescription>
          )}
          {isSearching ? (
            <FieldDescription className="flex items-center gap-2">
              <Spinner aria-hidden="true" />
              {SEARCHING_NOTE}
            </FieldDescription>
          ) : null}
          <FieldError id={errorId} errors={fieldState.error ? [fieldState.error] : undefined} />
        </FieldSet>
      )}
    />
  );
}

export default MergeTargetField;
