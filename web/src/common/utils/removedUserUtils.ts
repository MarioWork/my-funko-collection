import type { NamedApiModel } from '@app-types/models';

// How the app names a user who no longer exists where something they left behind is still shown (docs/GLOSSARY.md,
// "Removed user"): the uploader of an image, the sender of a submission.
export const REMOVED_USER = 'Removed user';
export const REMOVED_USER_IN_SENTENCE = 'a removed user';

// The user's name, or the given words once the API sends null for a deleted user.
export function userNameOrRemoved(user: NamedApiModel | null, removedUserText: string = REMOVED_USER): string {
  return user?.name ?? removedUserText;
}
