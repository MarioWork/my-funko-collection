import { useIsAdmin } from '@hooks/useIsAdmin';
import { canEditFunko, type FunkoStanding } from '../funkoAccessUtils';

// True when the signed-in user may change this funko and its images: an admin any, a member only their own waiting
// submission. The API refuses the rest anyway (403 ADMIN_ONLY).
export function useCanEditFunko(funko: FunkoStanding): boolean {
  const isAdmin = useIsAdmin();

  return canEditFunko(funko, isAdmin);
}
