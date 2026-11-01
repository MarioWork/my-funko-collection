import { yupResolver } from '@hookform/resolvers/yup';
import { KeyRound } from 'lucide-react';
import { useFetcher, useLoaderData } from 'react-router';
import type { AuthSessionApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil, type LoaderDataUtil } from '@app-types/utility';
import AuthLayout from '@components/AuthLayout';
import PasskeyButton from '@components/PasskeyButton';
import PasskeyUnsupportedNotice from '@components/PasskeyUnsupportedNotice';
import TextField from '@components/TextField';
import { FieldGroup } from '@components/ui/field';
import { useFormCompat } from '@hooks/useFormCompat';
import { AuthApiErrorCodes } from '@services/authService/authService';
import { createFormData } from '@utils/formDataUtils';
import { isPasskeySupported } from '@utils/passkeyUtils';
import SetupFailure from './components/SetupFailure';
import type { loader } from './setupLoader';
import { LOGS_COMMAND, setupFormSchema, type SetupFormValues } from './setupUtils';

const FORM_ID = 'setup';

// The first run, opened from the link the server prints (/setup?code=...). The submit goes to this route's action,
// which runs the whole passkey registration and opens the app.
function Setup() {
  const { code } = useLoaderData<LoaderDataUtil<typeof loader>>();
  const fetcher = useFetcher<JSONResponseUtil<AuthSessionApiModel>>();
  const { control, handleSubmit } = useFormCompat<SetupFormValues>({
    defaultValues: { code, name: '', passkeyName: '' },
    resolver: yupResolver(setupFormSchema),
  });
  const isSupported = isPasskeySupported();
  const isCreating = fetcher.state !== 'idle';
  const hasFailed = fetcher.data?.success === false && !isCreating;
  const failure = hasFailed ? fetcher.data?.error : undefined;
  // No code in the link, or a wrong one: let the user paste it.
  const isCodeFieldShown = code === '' || failure?.code === AuthApiErrorCodes.INVALID_SETUP_CODE;

  const onSubmit = handleSubmit((values) => {
    void fetcher.submit(createFormData({ setup: values }), { method: HttpVerbsUtil.POST });
  });

  return (
    <AuthLayout
      label="New collector"
      title="Let's get you set up!"
      description="Pick a name and create a passkey. It's how you'll open your collection from now on, no password needed."
    >
      <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-5">
        <FieldGroup>
          <TextField
            control={control}
            idPrefix={FORM_ID}
            name="name"
            label="What should we call you?"
            placeholder="Mario"
            autoComplete="nickname"
          />
          <TextField
            control={control}
            idPrefix={FORM_ID}
            name="passkeyName"
            label="Passkey name (optional)"
            placeholder="iPhone, Bitwarden…"
            description="Helps you tell your passkeys apart later."
            autoComplete="off"
          />
          {isCodeFieldShown ? (
            <TextField
              control={control}
              idPrefix={FORM_ID}
              name="code"
              label="Setup code"
              autoComplete="off"
              isPlainText
              description={
                <>
                  It&apos;s in the setup link printed in the server log: <code>{LOGS_COMMAND}</code>
                </>
              }
            />
          ) : null}
        </FieldGroup>
        <PasskeyButton
          type="submit"
          isWaiting={isCreating}
          isSupported={isSupported}
          icon={<KeyRound data-icon="inline-start" aria-hidden="true" />}
          size="lg"
          className="h-12 w-full text-base"
        >
          Create my passkey
        </PasskeyButton>
        {isSupported ? null : <PasskeyUnsupportedNotice />}
        {hasFailed ? <SetupFailure failure={failure} /> : null}
      </form>
    </AuthLayout>
  );
}

export default Setup;
