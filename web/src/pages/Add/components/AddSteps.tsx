import type { CollectionApiModel } from '@app-types/models';
import BarcodeScanner from './BarcodeScanner';
import { Button } from '@components/ui/button';
import type { useAddDestination } from '@hooks/useAddDestination';
import { cn } from '@utils/classNameUtils';
import { ENTER_UP_CLASS } from '@utils/motionUtils';
import { AddStepUtil, ScanResultKindUtil } from '../addUtils';
import type { useAddFlow } from '../hooks/useAddFlow';
import AddFunkoForm from './AddFunkoForm';
import SavedCard from './SavedCard';
import ScanFoundCard from './ScanFoundCard';

type CurrentStepProps = {
  flow: ReturnType<typeof useAddFlow>;
  destinationState: ReturnType<typeof useAddDestination>;
  collections: CollectionApiModel[];
};

type Props = CurrentStepProps;

// What the Add flow shows at each step: the scanner, the found card (+1), the form, then the saved card. Everyone
// gets the form: an admin's new funko joins the catalogue, a member's waits for an admin as a submission.
function CurrentStep({ flow, destinationState, collections }: CurrentStepProps) {
  const { step, lookup } = flow;

  if (step === AddStepUtil.SCAN) {
    return (
      <>
        <BarcodeScanner isActive={!lookup.isLookingUp} onDetected={(code) => void flow.handleDetected(code)} />
        <Button variant="link" className="self-start" onClick={flow.addAnother}>
          Add without a barcode
        </Button>
      </>
    );
  }

  if (step === AddStepUtil.FOUND && lookup.result?.kind === ScanResultKindUtil.FOUND) {
    const { funko } = lookup.result;

    return (
      <ScanFoundCard
        funko={funko}
        collections={collections}
        selectedCollectionIds={destinationState.destination.collectionIds}
        isSubmitting={flow.isSubmitting}
        errorMessage={flow.failure?.message}
        onCollectionsChange={destinationState.setCollectionIds}
        onIncrement={() => flow.submitIncrement(funko.id)}
        onScanAnother={flow.scanAnother}
      />
    );
  }

  if (step === AddStepUtil.FORM) {
    return (
      <AddFunkoForm
        key={flow.formKey}
        initialValues={{ categoryId: destinationState.lastCategoryId, barcode: flow.formBarcode }}
        initialCollectionIds={destinationState.destination.collectionIds}
        initialTagIds={destinationState.destination.tagIds}
        isSubmitting={flow.isSubmitting}
        errorMessage={flow.failure?.message}
        existingFunkoId={flow.failure?.existingId}
        onSubmit={(submission) => void flow.submitCreate(submission)}
      />
    );
  }

  if (step === AddStepUtil.SAVED && flow.saved) {
    return <SavedCard result={flow.saved} onAddAnother={flow.addAnother} onScanAnother={flow.scanAnother} />;
  }

  return null;
}

// Each step rises in as the last one goes, so scan → found → form → saved reads as one flow instead of a swap.
// Keyed by the form too: "Add another" starts a fresh form and plays it again.
function AddSteps({ flow, ...stepProps }: Props) {
  const stepKey = `${flow.step}-${flow.formKey}`;

  return (
    <div key={stepKey} className={cn('flex flex-col gap-4', ENTER_UP_CLASS)}>
      <CurrentStep flow={flow} {...stepProps} />
    </div>
  );
}

export default AddSteps;
