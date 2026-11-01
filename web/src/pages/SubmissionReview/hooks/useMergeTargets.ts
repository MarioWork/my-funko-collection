import type { ReviewSubmissionApiModel } from '@app-types/models';
import { DOUBLE_MATCH_FIELD_LABELS, SubmissionStatusUtil } from '@app-types/utility';
import { useSuggestions } from '@hooks/useSuggestions';
import type { MergeTarget } from '../submissionReviewUtils';

const DOUBLE_HINT_PREFIX = 'Maybe a double';

// A submission's approved maybe-doubles, with why each may be the same: another waiting submission is not in the
// catalogue, so it cannot be a target.
function doubleTargetsOf(submission: ReviewSubmissionApiModel): MergeTarget[] {
  return submission.possibleDoubles
    .filter((double) => double.status === SubmissionStatusUtil.APPROVED)
    .map((double) => ({
      id: double.id,
      name: double.name,
      number: double.number,
      hint: `${DOUBLE_HINT_PREFIX}: ${double.matchedOn.map((field) => DOUBLE_MATCH_FIELD_LABELS[field]).join(', ')}`,
    }));
}

// The merge dialog's choices: the maybe-doubles first, then the one picked from an earlier search (so a new search
// never hides the choice), then what the search finds, each once. The search reuses the type-ahead over /suggest
// (useSuggestions), which an admin sees as the approved catalogue.
export function useMergeTargets(
  submission: ReviewSubmissionApiModel,
  query: string,
  pickedTarget: MergeTarget | undefined,
) {
  const { suggestions, isLoading } = useSuggestions(query);
  const doubleTargets = doubleTargetsOf(submission);
  const isPickedListed = pickedTarget === undefined || doubleTargets.some((target) => target.id === pickedTarget.id);
  const keptTargets = isPickedListed ? doubleTargets : [...doubleTargets, pickedTarget];
  const listedIds = new Set([submission.id, ...keptTargets.map((target) => target.id)]);

  const foundTargets: MergeTarget[] = (suggestions?.funkos ?? [])
    .filter((funko) => !listedIds.has(funko.id))
    .map((funko) => ({ id: funko.id, name: funko.name, number: funko.number, hint: funko.category.name }));

  return { targets: [...keptTargets, ...foundTargets], isSearching: isLoading };
}
