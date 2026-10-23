import { LogIn } from 'lucide-react';
import type { ApiError } from '@app-types/models';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import InlineAlert from '@components/InlineAlert';
import LinkButton from '@components/LinkButton';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { authFailureMessage } from '@utils/authMessageUtils';
import { SETUP_FAILURE_MESSAGES } from '../setupUtils';

type Props = {
  failure: ApiError | undefined;
};

// role="alert" (InlineAlert): read out as soon as it appears. "Already set up" also offers the way out.
function SetupFailure({ failure }: Props) {
  const isAlreadySetUp = failure?.code === AuthApiErrorCodes.ALREADY_SET_UP;

  return (
    <div className="flex flex-col gap-3">
      <InlineAlert tone="error">{authFailureMessage(failure, SETUP_FAILURE_MESSAGES)}</InlineAlert>
      {isAlreadySetUp ? (
        <LinkButton to={AUTH_ROUTES_PATHS.LOGIN} variant="outline" className="w-full">
          <LogIn data-icon="inline-start" aria-hidden="true" />
          Go to sign in
        </LinkButton>
      ) : null}
    </div>
  );
}

export default SetupFailure;
