import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowLeft, Merge } from 'lucide-react';
import type { ApiError, FunkoDetailApiModel } from '@app-types/models';
import { SUBMISSION_ROUTES_PATHS } from '@application/routes/routesUtils';
import CancelButton from '@components/CancelButton';
import InlineAlert from '@components/InlineAlert';
import LinkButton from '@components/LinkButton';
import SubmitButton from '@components/SubmitButton';
import { DialogFooter } from '@components/ui/dialog';
import { FieldGroup } from '@components/ui/field';
import { useFormCompat } from '@hooks/useFormCompat';
import type { MergeSubmission } from '@services/submissionService/submissionService.type';
import { SubmissionApiMergeFields } from '@services/submissionService/submissionService';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import { funkoLabelOf } from '@utils/funkoUtils';
import type { MergeComparison } from '../mergeSubmissionDialogLoader';
import {
  barcodeTakenReason,
  compareMergeFields,
  defaultCompareValues,
  mergeCompareFormSchema,
  toMergeChoices,
  type MergeCompareFormValues,
} from '../mergeSubmissionDialogUtils';
import MergeFieldChoice from './MergeFieldChoice';
import MergeImageChoices from './MergeImageChoices';
import MergeSameFields from './MergeSameFields';

type Props = {
  submission: FunkoDetailApiModel;
  comparison: MergeComparison;
  isSaving: boolean;
  failure: ApiError | undefined;
  onMerge: (choices: MergeSubmission) => void;
  onCancel: () => void;
};

const FORM_ID = 'merge-compare';
const NOTHING_DIFFERS = 'Every field is the same on both.';

// The side-by-side step: each field that differs as Original or Submission (the original's to start with), the
// fields that are the same once, and which images the catalogue funko keeps. Mounted per original (keyed by the
// dialog), so picking another funko starts it fresh.
function MergeCompareStep({ submission, comparison, isSaving, failure, onMerge, onCancel }: Props) {
  const { original, barcodeOwner } = comparison;
  const { differingRows, sameRows } = compareMergeFields(original, submission);
  const { control, handleSubmit } = useFormCompat<MergeCompareFormValues>({
    defaultValues: defaultCompareValues(differingRows, original),
    resolver: yupResolver(mergeCompareFormSchema),
  });
  const pickAnotherReason = reasonWhen(isSaving, DISABLED_REASONS.SAVING);

  const onSubmit = handleSubmit((values) => onMerge(toMergeChoices(values, original, submission)));

  return (
    <>
      <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Original: <span className="font-medium text-foreground">{funkoLabelOf(original)}</span>
        </p>
        <FieldGroup>
          {differingRows.length === 0 ? <p className="text-sm">{NOTHING_DIFFERS}</p> : null}
          {differingRows.map((row) => (
            <MergeFieldChoice
              key={row.field}
              control={control}
              idPrefix={FORM_ID}
              row={row}
              submissionDisabledReason={
                row.field === SubmissionApiMergeFields.BARCODE ? barcodeTakenReason(barcodeOwner) : undefined
              }
            />
          ))}
        </FieldGroup>
        <MergeSameFields rows={sameRows} />
        <MergeImageChoices
          control={control}
          idPrefix={FORM_ID}
          originalImages={original.images}
          submissionImages={submission.images}
        />
        {failure ? <InlineAlert tone="error">{failure.message ?? GENERIC_WRITE_ERROR}</InlineAlert> : null}
      </form>
      <DialogFooter>
        <LinkButton
          variant="ghost"
          to={SUBMISSION_ROUTES_PATHS.mergeInto(String(submission.id))}
          disabledReason={pickAnotherReason}
          className="sm:mr-auto"
        >
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Pick another funko
        </LinkButton>
        <CancelButton isSubmitting={isSaving} onCancel={onCancel} />
        <SubmitButton
          isSubmitting={isSaving}
          form={FORM_ID}
          icon={<Merge data-icon="inline-start" aria-hidden="true" />}
        >
          Merge
        </SubmitButton>
      </DialogFooter>
    </>
  );
}

export default MergeCompareStep;
