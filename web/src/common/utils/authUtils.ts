import { string } from 'yup';

// The API's limits (auth contract): a name and a passkey name are both 1..60 characters once trimmed.
const USER_NAME_MAX_LENGTH = 60;
const PASSKEY_NAME_MAX_LENGTH = 60;

export const userNameSchema = string()
  .trim()
  .required('Tell us what to call you')
  .max(USER_NAME_MAX_LENGTH, `Keep it to ${USER_NAME_MAX_LENGTH} characters or fewer`);

export const passkeyNameSchema = string()
  .trim()
  .required('Give this passkey a name')
  .max(PASSKEY_NAME_MAX_LENGTH, `Keep it to ${PASSKEY_NAME_MAX_LENGTH} characters or fewer`);

// Optional on the first-run page: the API names it after the device when it is left out.
export const optionalPasskeyNameSchema = string()
  .trim()
  .max(PASSKEY_NAME_MAX_LENGTH, `Keep it to ${PASSKEY_NAME_MAX_LENGTH} characters or fewer`)
  .notRequired();

export const setupCodeSchema = string().trim().required('Paste the setup code from the server log');
