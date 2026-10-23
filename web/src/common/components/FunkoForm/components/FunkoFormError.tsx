import { Link } from 'react-router';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import InlineAlert from '@components/InlineAlert';
import { cn } from '@utils/classNameUtils';
import { LINK_FOCUS_CLASS } from '@utils/focusUtils';

type Props = {
  message: string;
  // The funko that already has these details or this barcode (a 409), so the user can jump to it.
  existingFunkoId?: number;
};

const LINK_CLASS = 'font-medium underline underline-offset-4 hover:text-foreground';

// Why the last save failed, announced at once; a duplicate also links to the funko it clashes with.
function FunkoFormError({ message, existingFunkoId }: Props) {
  return (
    <InlineAlert tone="error">
      {message}
      {existingFunkoId === undefined ? null : (
        <>
          {' '}
          <Link to={FUNKO_ROUTES_PATHS.detail(String(existingFunkoId))} className={cn(LINK_CLASS, LINK_FOCUS_CLASS)}>
            Open it
          </Link>
        </>
      )}
    </InlineAlert>
  );
}

export default FunkoFormError;
