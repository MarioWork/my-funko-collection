import { useLoaderData, useLocation } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import BarcodeScanner from '@components/BarcodeScanner';
import { toFunkoPayload } from '@components/FunkoFormFields/funkoFormUtils';
import PageHeader from '@components/PageHeader';
import { Button } from '@components/ui/button';
import { AddStepUtil, toQuickFunkoPayload } from './addUtils';
import AddDestination from './components/AddDestination';
import AddDetailsForm from './components/AddDetailsForm';
import AddedCard from './components/AddedCard';
import QuickAddForm from './components/QuickAddForm';
import ScanFoundCard from './components/ScanFoundCard';
import type { loader } from './addLoader';
import { useAddDestination } from '@hooks/useAddDestination';
import { useGoBack } from '@hooks/useGoBack';
import { useAddFlow } from './hooks/useAddFlow';

const SINGLE = 1;

// Scan-first: viewfinder → found card (+1) or quick form → added card with photos → viewfinder again.
// /add/manual starts on the full form instead. Everything lands in the remembered destination.
function Add() {
  const { categories, collections, tags } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { pathname } = useLocation();
  const isManual = pathname === ADD_ROUTES_PATHS.MANUAL;
  const goBack = useGoBack();
  const destinationState = useAddDestination({ collections, tags });
  const flow = useAddFlow({
    isManual,
    destination: destinationState.destination,
    rememberCategory: destinationState.rememberCategory,
  });
  const { step, lookup } = flow;
  const title = step === AddStepUtil.DETAILS ? 'Add a funko' : 'Scan a box';

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={title} description="Pick where it goes once, then add box after box." onBack={goBack} />
      <AddDestination
        collections={collections}
        tags={tags}
        collectionId={destinationState.destination.collectionId}
        selectedTags={destinationState.selectedTags}
        onCollectionChange={destinationState.setCollectionId}
        onTagsChange={destinationState.setTags}
      />

      {step === AddStepUtil.SCAN ? (
        <>
          <BarcodeScanner isActive={!lookup.isLookingUp} onDetected={(code) => void flow.handleDetected(code)} />
          <Button variant="link" className="self-start" onClick={() => flow.openDetails()}>
            Add without a barcode
          </Button>
        </>
      ) : null}

      {step === AddStepUtil.FOUND && lookup.result?.kind === 'found' ? (
        <ScanFoundCard
          funko={lookup.result.funko}
          collection={destinationState.collection}
          isSubmitting={flow.isSubmitting}
          onIncrement={() => flow.submitIncrement(lookup.result?.kind === 'found' ? lookup.result.funko.id : 0)}
          onScanAgain={flow.scanAgain}
        />
      ) : null}

      {step === AddStepUtil.QUICK && lookup.result?.kind === 'not-found' ? (
        <QuickAddForm
          barcode={lookup.result.barcode}
          categories={categories}
          lastCategoryId={destinationState.lastCategoryId}
          isSubmitting={flow.isSubmitting}
          errorMessage={flow.failure?.message}
          onSubmit={(values) => flow.submitCreate(toQuickFunkoPayload(values), values.quantity)}
          onMoreDetails={flow.openDetails}
          onScanAgain={flow.scanAgain}
        />
      ) : null}

      {step === AddStepUtil.DETAILS ? (
        <AddDetailsForm
          categories={categories}
          initialValues={{ categoryId: destinationState.lastCategoryId, ...flow.detailsValues }}
          isSubmitting={flow.isSubmitting}
          errorMessage={flow.failure?.message}
          onSubmit={(values) => flow.submitCreate(toFunkoPayload(values), SINGLE)}
        />
      ) : null}

      {step === AddStepUtil.ADDED && flow.addedFunko ? (
        <AddedCard
          funko={flow.addedFunko}
          collectionName={destinationState.collection?.name}
          onScanAgain={flow.scanAgain}
        />
      ) : null}
    </div>
  );
}

export default Add;
