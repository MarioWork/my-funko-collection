import { use } from 'react';
import { ReviewActionsContext, type ReviewActionsContextValue } from '../ReviewActionsContext';

export function useReviewActionsContext(): ReviewActionsContextValue {
  return use(ReviewActionsContext);
}
