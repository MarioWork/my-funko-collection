import type { LoaderFunctionArgs } from 'react-router';
import type { FunkoApiModel, FunkoDetailApiModel } from '@app-types/models';
import { DEFAULT_FIRST_PAGE, SubmissionStatusUtil } from '@app-types/utility';
import { MERGE_TARGET_PARAM } from '@application/routes/routesUtils';
import funkoService, { FunkoApiSearchFields } from '@services/funkoService/funkoService';
import { assertAdmin } from '@utils/adminRouteUtils';
import { assertCanWrite } from '@utils/readOnlyRouteUtils';

// A barcode is unique in the catalogue, so one page of two is enough to find another funko holding it.
const BARCODE_LOOKUP_SIZE = '2';
const POSITIVE_ID = /^[1-9]\d*$/;

// The side-by-side step: the catalogue funko the submission is compared with, and the other catalogue funko that
// already holds the submission's barcode (so that option is offered disabled, with why), if any.
export type MergeComparison = { original: FunkoDetailApiModel; barcodeOwner: FunkoApiModel | null };

function targetIdOf(request: Request): number | undefined {
  const targetParam = new URL(request.url).searchParams.get(MERGE_TARGET_PARAM) ?? '';

  return POSITIVE_ID.test(targetParam) ? Number(targetParam) : undefined;
}

// Only asked when picking the submission's barcode would change the original entry's.
async function findBarcodeOwner(
  submission: FunkoDetailApiModel,
  original: FunkoDetailApiModel,
): Promise<FunkoApiModel | null> {
  if (submission.barcode === null || submission.barcode === original.barcode) return null;

  const fields = {
    pagination: { page: DEFAULT_FIRST_PAGE, size: BARCODE_LOOKUP_SIZE },
    [FunkoApiSearchFields.BARCODE]: submission.barcode,
  };
  const matches = await funkoService.getFunkos(fields);
  const owner = matches.data.find(
    (funko) => funko.status === SubmissionStatusUtil.APPROVED && funko.id !== original.id,
  );

  return owner ?? null;
}

// Admins only, and only those who may write (the dialog exists only to merge). The submission, with its images; and
// once a catalogue funko is picked (`?into=` in the URL, so the browser's back button returns to the pick step), that
// funko too, for the side-by-side step.
export async function loader({ params, request, context }: LoaderFunctionArgs) {
  assertAdmin(context);
  assertCanWrite(context);

  const submission = await funkoService.getFunko(Number(params.funkoId));
  const targetId = targetIdOf(request);

  if (targetId === undefined || targetId === submission.id) return { submission, comparison: null };

  const original = await funkoService.getFunko(targetId);
  const comparison: MergeComparison = { original, barcodeOwner: await findBarcodeOwner(submission, original) };

  return { submission, comparison };
}
