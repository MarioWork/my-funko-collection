// `isSynced`: backed up by a passkey manager (iCloud Keychain, Google Password Manager, Bitwarden...).
export interface PasskeyApiModel {
  id: string;
  name: string;
  isSynced: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export type PasskeyId = PasskeyApiModel['id'];
