import { useEffect } from 'react';
import { useLoaderData, useLocation } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import FormPanel from '@components/FormPanel';
import PageHeader from '@components/PageHeader';
import { useAddDestination } from '@hooks/useAddDestination';
import { useGoBack } from '@hooks/useGoBack';
import { useIsDesktop } from '@hooks/useMediaQuery';
import { AddStepUtil } from './addUtils';
import AddSteps from './components/AddSteps';
import type { loader } from './addLoader';
import { useAddFlow } from './hooks/useAddFlow';

const STEP_TITLES: Record<AddStepUtil, string> = {
  [AddStepUtil.SCAN]: 'Scan a box',
  [AddStepUtil.FOUND]: 'Scan a box',
  [AddStepUtil.FORM]: 'New funko',
  [AddStepUtil.SAVED]: 'Saved',
};

const STEP_DESCRIPTIONS: Record<AddStepUtil, string> = {
  [AddStepUtil.SCAN]: 'Point the camera at the barcode.',
  [AddStepUtil.FOUND]: 'Already in your catalog.',
  [AddStepUtil.FORM]: 'Details, collections and images. One Save does it all.',
  [AddStepUtil.SAVED]: 'On to the next one.',
};

// Scan-first: viewfinder → found card (+1) or the form with the barcode filled in → saved card → next one.
// /add and /add/manual are pages (the phone's Add button). Under Home or Funkos (…/add, …/scan) the same flow is a
// dialog over that page on desktop. The collections and tags picked are remembered for the next funko.
function Add() {
  const { categories, collections, tags } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();
  const goBack = useGoBack();
  const isStandalone = pathname.startsWith(ADD_ROUTES_PATHS.BASE);
  const isScanFirst = pathname === ADD_ROUTES_PATHS.BASE || pathname.endsWith(`/${ADD_ROUTES_PATHS.NESTED_SCAN}`);
  const isDialog = isDesktop && !isStandalone;
  const destinationState = useAddDestination({ collections, tags });
  const flow = useAddFlow({
    isManual: !isScanFirst,
    destination: destinationState.destination,
    rememberDestination: destinationState.remember,
    rememberCategory: destinationState.rememberCategory,
  });

  // The page twin of FormPanel's scrollKey: each step starts at the top.
  useEffect(() => {
    if (!isDialog) window.scrollTo({ top: 0 });
  }, [flow.step, isDialog]);

  const steps = (
    <AddSteps
      flow={flow}
      destinationState={destinationState}
      categories={categories}
      collections={collections}
      isInDialog={isDialog}
    />
  );

  if (isDialog) {
    return (
      <FormPanel
        title={STEP_TITLES[flow.step]}
        description={STEP_DESCRIPTIONS[flow.step]}
        onClose={goBack}
        isWide
        scrollKey={flow.step}
      >
        {steps}
      </FormPanel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={STEP_TITLES[flow.step]} description={STEP_DESCRIPTIONS[flow.step]} onBack={goBack} />
      {steps}
    </div>
  );
}

export default Add;
