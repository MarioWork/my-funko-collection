import type { FunkoApiModel } from '@app-types/models';
import { canEditFunko } from '@utils/funkoAccessUtils';
import { useIsAdmin } from './useIsAdmin';

// True when the signed-in user may change this funko and its images: an admin any, a member only their own waiting
// submission. The API refuses the rest anyway (403 ADMIN_ONLY).
export function useCanEditFunko(funko: Pick<FunkoApiModel, 'status' | 'isSubmittedByMe'>): boolean {
  const isAdmin = useIsAdmin();

  return canEditFunko(funko, isAdmin);
}
