import { notificationsRepository } from './notifications.repository.ts';
import { notifyFunkoRemoved, notifySubmissionApproved } from './notifications.service.ts';

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

describe('notifyFunkoRemoved', () => {
  it('resolves without throwing when the notification fails to write', async () => {
    vi.mocked(notificationsRepository.createAndTrim).mockRejectedValueOnce(new Error('connection lost'));

    const notifying = notifyFunkoRemoved([7, 8], 'Grogu', 'Two entries for the same figure');

    await expect(notifying).resolves.toBeUndefined();
  });

  it('writes one notification per user with the name and the reason and no funko link', async () => {
    vi.mocked(notificationsRepository.createAndTrim).mockResolvedValueOnce();

    await notifyFunkoRemoved([7, 8], 'Grogu', 'Two entries for the same figure');

    expect(notificationsRepository.createAndTrim).toHaveBeenCalledWith(
      {
        userIds: [7, 8],
        kind: 'FUNKO_REMOVED',
        funkoId: null,
        funkoName: 'Grogu',
        reason: 'Two entries for the same figure',
      },
      expect.any(Date),
    );
  });
});
