import { useEffect } from 'react';
import { useLoaderData, useLocation } from 'react-router';
import type { LoaderDataUtil } from '@app-types/utility';
import { ADD_ROUTES_PATHS } from '@application/routes/routesUtils';
import PageHeader from '@components/PageHeader';
import { PAGE_ICONS } from '@utils/navigationUtils';
import { useAddDestination } from '@hooks/useAddDestination';
import { useGoBack } from '@hooks/useGoBack';
import { useIsAdmin } from '@hooks/useIsAdmin';
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
  [AddStepUtil.FORM]: 'Images, details and the collections it goes in. One Save does it all.',
  [AddStepUtil.SAVED]: 'On to the next one.',
};

// A member's new funko is a submission: it waits for an admin, and only they see it meanwhile.
const MEMBER_FORM_DESCRIPTION =
  'Images, details and the collections it goes in. It waits for an admin to approve it; only you see it until then.';

// Scan-first: viewfinder → found card (+1) or the form with the barcode filled in → saved card → next one.
// Always a page of its own: /add opens on the scanner, /add/manual on the form. The collections and tags picked
// are remembered for the next funko.
function Add() {
  const { collections, tags } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const { pathname } = useLocation();
  const goBack = useGoBack();
  const isAdmin = useIsAdmin();
  const isScanFirst = pathname === ADD_ROUTES_PATHS.BASE;
  const destinationState = useAddDestination({ collections, tags });
  const flow = useAddFlow({
    isManual: !isScanFirst,
    destination: destinationState.destination,
    rememberDestination: destinationState.remember,
    rememberCategory: destinationState.rememberCategory,
  });

  // Each step starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [flow.step]);

  const isMemberForm = !isAdmin && flow.step === AddStepUtil.FORM;
  const title = STEP_TITLES[flow.step];
  const description = isMemberForm ? MEMBER_FORM_DESCRIPTION : STEP_DESCRIPTIONS[flow.step];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader icon={PAGE_ICONS.FUNKOS} title={title} description={description} onBack={goBack} />
      <AddSteps flow={flow} destinationState={destinationState} collections={collections} />
    </div>
  );
}

export default Add;
