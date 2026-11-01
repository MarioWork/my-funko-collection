import { ConflictError } from '../../../lib/httpErrors.ts';
import { logger } from '../../../lib/logger.ts';
import type { SignedInUser } from '../../auth/auth.type.ts';
import { assertCanEditFunko } from '../../funkos/funkos.access.ts';
import { assertUniqueFunko } from '../../funkos/basics/basics.service.ts';
import type { FunkoStanding } from '../../funkos/funkos.type.ts';
import { notifyAdminsOfResentSubmission } from '../../notifications/notifications.service.ts';
import { submissionsRepository } from '../submissions.repository.ts';
import { identityOf, toSingleSubmission } from '../submissions.service.ts';
import type { SubmissionResponse } from '../submissions.type.ts';
import { resubmissionRepository } from './resubmission.repository.ts';

const NOT_REJECTED_MESSAGE = 'Only a rejected submission can be sent again';

const log = logger.child({ module: 'submissions' });

// The sender sends a rejected submission in again, once it fits their other waiting ones and the catalogue.
export async function resendSubmission(user: SignedInUser, id: number): Promise<SubmissionResponse> {
  const current = assertCanEditFunko(user, id, await submissionsRepository.findById(id));

  if (current.status !== 'REJECTED') throw new ConflictError(NOT_REJECTED_MESSAGE);

  const waiting: FunkoStanding = { status: 'WAITING', submittedById: current.submittedById };

  await assertUniqueFunko(waiting, identityOf(current), current.barcode, id);

  const isResent = await resubmissionRepository.resend(id);

  if (!isResent) throw new ConflictError(NOT_REJECTED_MESSAGE);

  log.info({ funkoId: id }, 'submission sent again');

  await notifyAdminsOfResentSubmission({ funkoId: id, funkoName: current.name });

  return toSingleSubmission(id);
}
