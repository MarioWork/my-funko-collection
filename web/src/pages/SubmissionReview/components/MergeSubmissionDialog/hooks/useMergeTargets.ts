import type { FunkoId, ReviewSubmissionApiModel } from '@app-types/models';
import { DOUBLE_MATCH_FIELD_LABELS } from '@app-types/utility';
import { useSuggestions } from '@hooks/useSuggestions';
import { funkoLabelOf } from '@utils/funkoUtils';
import { catalogueDoublesOf } from '../../../submissionReviewUtils';
import type { MergeTarget } from '../mergeSubmissionDialogUtils';
import { useReviewedSubmission } from './useReviewedSubmission';

const DOUBLE_HINT_PREFIX = 'Maybe a double';

// A submission's catalogue maybe-doubles, with why each may be the same (none once it left the review list).
function doubleTargetsOf(reviewed: ReviewSubmissionApiModel | undefined): MergeTarget[] {
  if (!reviewed) return [];

  return catalogueDoublesOf(reviewed).map((double) => ({
    id: double.id,
    label: funkoLabelOf(double),
    hint: `${DOUBLE_HINT_PREFIX}: ${double.matchedOn.map((field) => DOUBLE_MATCH_FIELD_LABELS[field]).join(', ')}`,
  }));
}

// The pick step's choices: the maybe-doubles first, then the one picked from an earlier search (so a new search
// never hides the choice), then what the search finds, each once. The search reuses the type-ahead over /suggest
// (useSuggestions), which an admin sees as the approved catalogue.
export function useMergeTargets(submissionId: FunkoId, query: string, pickedTarget: MergeTarget | undefined) {
  const { suggestions, isLoading } = useSuggestions(query);
  const reviewed = useReviewedSubmission(submissionId);
  const doubleTargets = doubleTargetsOf(reviewed);
  const isPickedListed = pickedTarget === undefined || doubleTargets.some((target) => target.id === pickedTarget.id);
  const keptTargets = isPickedListed ? doubleTargets : [...doubleTargets, pickedTarget];
  const listedIds = new Set([submissionId, ...keptTargets.map((target) => target.id)]);

  const foundTargets: MergeTarget[] = (suggestions?.funkos ?? [])
    .filter((funko) => !listedIds.has(funko.id))
    .map((funko) => ({ id: funko.id, label: funkoLabelOf(funko), hint: funko.category.name }));

  return { targets: [...keptTargets, ...foundTargets], isSearching: isLoading };
}
