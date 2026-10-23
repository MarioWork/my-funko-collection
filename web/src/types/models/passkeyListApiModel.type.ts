import type { PasskeyApiModel } from './passkeyApiModel.type';

// GET /auth/passkeys: every passkey at once, newest first, no paging.
export interface PasskeyListApiModel {
  data: PasskeyApiModel[];
}
