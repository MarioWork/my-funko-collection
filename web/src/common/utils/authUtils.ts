import { string } from 'yup';

// The API's limits (auth contract): a name and a passkey name are both 1..60 characters once trimmed.
const USER_NAME_MAX_LENGTH = 60;
const PASSKEY_NAME_MAX_LENGTH = 60;
// A password is 15..256 characters (NIST SP 800-63B-4), never trimmed; a username 3..32 letters, digits, ".", "-"
// or "_", which the API stores lower-case. The common-password list is checked by the API only.
export const PASSWORD_MIN_LENGTH = 15;
const PASSWORD_MAX_LENGTH = 256;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

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

export const usernameSchema = string()
  .trim()
  .required('Pick a username')
  .min(USERNAME_MIN_LENGTH, `Use at least ${USERNAME_MIN_LENGTH} characters`)
  .max(USERNAME_MAX_LENGTH, `Keep it to ${USERNAME_MAX_LENGTH} characters or fewer`)
  .matches(USERNAME_PATTERN, 'Use letters, digits, dots, dashes or underscores');

// What the sign-in form sends: anything typed. Every character counts, spaces included.
export const passwordSchema = string()
  .required('Type your password')
  .max(PASSWORD_MAX_LENGTH, `Keep it to ${PASSWORD_MAX_LENGTH} characters or fewer`);

export const newPasswordSchema = passwordSchema.min(
  PASSWORD_MIN_LENGTH,
  `Use at least ${PASSWORD_MIN_LENGTH} characters. A few words in a row works well.`,
);

export const setupCodeSchema = string().trim().required('Paste the setup code from the server log');
