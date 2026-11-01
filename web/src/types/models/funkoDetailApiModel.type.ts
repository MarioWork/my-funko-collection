import type { FunkoApiModel } from './funkoApiModel.type';
import type { FunkoImageApiModel } from './funkoImageApiModel.type';
import type { NamedApiModel } from './namedApiModel.type';

export interface FunkoDetailApiModel extends FunkoApiModel {
  images: FunkoImageApiModel[];
  // Admins only, on a submission: who sent it in, or null once that user was deleted (a removed user).
  submittedBy?: NamedApiModel | null;
  // Admins and the sender only: why an admin rejected it (null unless rejected), and when an admin last changed it
  // before approving it (null if never). Left out for everyone else.
  rejectionReason?: string | null;
  changedByAdminAt?: string | null;
  // Admins only: how many users have it in a collection (never who), for deleting it. Left out for members.
  userCount?: number;
}
