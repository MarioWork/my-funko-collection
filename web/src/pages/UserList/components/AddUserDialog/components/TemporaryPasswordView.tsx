import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import type { CreatedUserApiModel } from '@app-types/models';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import { formatDateTime } from '@utils/dateUtils';

type Props = {
  created: CreatedUserApiModel;
  idPrefix: string;
};

// The one time the temporary password is shown: the admin copies it and hands it over. Nothing stores it, so closing
// the dialog loses it for good.
function TemporaryPasswordView({ created, idPrefix }: Props) {
  const [isCopied, setIsCopied] = useState(false);
  const { user, temporaryPassword } = created;
  const passwordId = `${idPrefix}-temporary-password`;
  const hintId = `${passwordId}-description`;
  const expiresAt = user.temporaryPasswordExpiresAt;

  const copyPassword = async () => {
    await navigator.clipboard.writeText(temporaryPassword);
    setIsCopied(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <InlineAlert tone="success">
        <strong className="font-semibold">{user.username}</strong> can sign in now.
      </InlineAlert>
      <Field>
        <FieldLabel htmlFor={passwordId}>Temporary password</FieldLabel>
        <div className="flex gap-2">
          <Input
            id={passwordId}
            value={temporaryPassword}
            readOnly
            aria-describedby={hintId}
            className="font-mono"
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button type="button" variant="outline" onClick={() => void copyPassword()}>
            {isCopied ? (
              <Check data-icon="inline-start" aria-hidden="true" />
            ) : (
              <Copy data-icon="inline-start" aria-hidden="true" />
            )}
            {isCopied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <FieldDescription id={hintId}>
          Copy it now: it is not shown again.
          {expiresAt ? ` It stops working on ${formatDateTime(expiresAt)} if unused.` : null} They choose their own
          password the first time they sign in.
        </FieldDescription>
      </Field>
    </div>
  );
}

export default TemporaryPasswordView;
