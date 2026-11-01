import { notificationsRepository } from './notifications.repository.ts';
import { notifySubmissionApproved } from './notifications.service.ts';

vi.mock('./notifications.repository.ts', () => ({
  notificationsRepository: { createAndTrim: vi.fn() },
}));

describe('notifySubmissionApproved', () => {
  it('resolves without throwing when the notification fails to write', async () => {
    vi.mocked(notificationsRepository.createAndTrim).mockRejectedValueOnce(new Error('connection lost'));

    const notifying = notifySubmissionApproved(7, { funkoId: 3, funkoName: 'Thanos' });

    await expect(notifying).resolves.toBeUndefined();
  });

  it('writes one notification to the sender when the write works', async () => {
    vi.mocked(notificationsRepository.createAndTrim).mockResolvedValueOnce();

    await notifySubmissionApproved(7, { funkoId: 3, funkoName: 'Thanos' });

    expect(notificationsRepository.createAndTrim).toHaveBeenCalledWith(
      { userIds: [7], kind: 'SUBMISSION_APPROVED', funkoId: 3, funkoName: 'Thanos', reason: null },
      expect.any(Date),
    );
  });
});
