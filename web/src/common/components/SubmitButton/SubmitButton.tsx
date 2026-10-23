import type { ReactNode } from 'react';
import DisabledReason from '@components/DisabledReason';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  isSubmitting: boolean;
  // The id of the form it submits, when the button sits outside it (a sheet or dialog footer).
  form?: string;
  // Shown before the label; a spinner takes its place while saving.
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

// A form's submit button: disabled while saving, with the spinner and the reason, so every form says the same.
function SubmitButton({ isSubmitting, form, icon, className, children }: Props) {
  return (
    <DisabledReason reason={reasonWhen(isSubmitting, DISABLED_REASONS.SAVING)}>
      <Button type="submit" form={form} className={className} disabled={isSubmitting}>
        {isSubmitting ? <Spinner data-icon="inline-start" /> : icon}
        {children}
      </Button>
    </DisabledReason>
  );
}

export default SubmitButton;
