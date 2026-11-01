import { Controller, type Control } from 'react-hook-form';
import type { FunkoImageApiModel } from '@app-types/models';
import FunkoImage from '@components/FunkoImage';
import { Checkbox } from '@components/ui/checkbox';
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '@components/ui/field';
import { MERGE_SIDE_LABELS, MergeSide, type MergeCompareFormValues } from '../mergeSubmissionDialogUtils';

type Props = {
  control: Control<MergeCompareFormValues>;
  idPrefix: string;
  originalImages: FunkoImageApiModel[];
  submissionImages: FunkoImageApiModel[];
};

type GroupProps = {
  side: MergeSide;
  idPrefix: string;
  images: FunkoImageApiModel[];
  keptImageIds: string[];
  onChange: (keptImageIds: string[]) => void;
};

type OptionProps = {
  id: string;
  image: FunkoImageApiModel;
  label: string;
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
};

const LEGEND = 'Images';
const DESCRIPTION =
  'Ticked images stay on the catalogue funko. The submission’s images you tick move over; the rest stay with the submission.';
const NO_IMAGES = 'No images';
const THUMB_SIZES = '64px';

// The kept ids with this one ticked or unticked.
function toggled(keptImageIds: string[], imageId: string, isChecked: boolean): string[] {
  const others = keptImageIds.filter((id) => id !== imageId);

  return isChecked ? [...others, imageId] : others;
}

// One image as a choice card: its checkbox, a thumbnail and its name.
function MergeImageOption({ id, image, label, isChecked, onCheckedChange }: OptionProps) {
  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal" className="items-center">
        <Checkbox id={id} checked={isChecked} onCheckedChange={onCheckedChange} />
        <FunkoImage image={image} alt="" sizes={THUMB_SIZES} className="aspect-3/4 w-12 rounded-md" />
        <FieldTitle>{label}</FieldTitle>
      </Field>
    </FieldLabel>
  );
}

// One funko's images as checkboxes, each named "Original entry image 1" / "Submission image 2".
function MergeImageGroup({ side, idPrefix, images, keptImageIds, onChange }: GroupProps) {
  const sideLabel = MERGE_SIDE_LABELS[side];

  return (
    <FieldSet>
      <FieldLegend variant="label">{sideLabel}</FieldLegend>
      {images.length === 0 ? <FieldDescription>{NO_IMAGES}</FieldDescription> : null}
      {images.map((image, index) => (
        <MergeImageOption
          key={image.id}
          id={`${idPrefix}-${side}-image-${image.id}`}
          image={image}
          label={`${sideLabel} image ${index + 1}`}
          isChecked={keptImageIds.includes(String(image.id))}
          onCheckedChange={(isChecked) => onChange(toggled(keptImageIds, String(image.id), isChecked))}
        />
      ))}
    </FieldSet>
  );
}

// Which images the catalogue funko ends up with: its own (all ticked to start with) and the submission's (none).
function MergeImageChoices({ control, idPrefix, originalImages, submissionImages }: Props) {
  return (
    <Controller
      control={control}
      name="keptImageIds"
      render={({ field }) => (
        <FieldSet>
          <FieldLegend variant="label">{LEGEND}</FieldLegend>
          <FieldDescription>{DESCRIPTION}</FieldDescription>
          <div className="grid gap-4 sm:grid-cols-2">
            <MergeImageGroup
              side={MergeSide.ORIGINAL}
              idPrefix={idPrefix}
              images={originalImages}
              keptImageIds={field.value}
              onChange={field.onChange}
            />
            <MergeImageGroup
              side={MergeSide.SUBMISSION}
              idPrefix={idPrefix}
              images={submissionImages}
              keptImageIds={field.value}
              onChange={field.onChange}
            />
          </div>
        </FieldSet>
      )}
    />
  );
}

export default MergeImageChoices;
