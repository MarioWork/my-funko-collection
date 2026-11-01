import { AuthStateUtil, NotificationKindUtil, SubmissionStatusUtil, UserRoleUtil } from '@app-types/utility';
import authService from '@services/authService/authService';
import notificationService from '@services/notificationService/notificationService';
import submissionService from '@services/submissionService/submissionService';
import userService from '@services/userService/userService';
import { DEV_SIGN_IN_PASSWORD } from '@utils/devPasswordUtils';
import { DEV_PERSONAS } from '@utils/devSignInUtils';
import { MockPersona } from './mockPersonas';
import { setMockAuthState, setMockPersona } from './mockStore';

const EVERY_PAGE = { page: '1', size: '100' };

async function notificationKindsSeen(): Promise<string[]> {
  const { data } = await notificationService.getNotifications({ pagination: EVERY_PAGE });

  return data.map((notification) => `${notification.kind} ${notification.isRead ? 'read' : 'unread'}`);
}

describe('signing in with the dev password in mock mode', () => {
  beforeEach(() => {
    setMockAuthState(AuthStateUtil.SIGNED_OUT);
  });

  it.each(DEV_PERSONAS)('signs in as $username with the dev password', async (persona) => {
    const result = await authService.signInWithPassword({
      username: persona.username,
      password: DEV_SIGN_IN_PASSWORD,
    });

    expect(result.data?.user).toEqual({
      name: persona.username,
      username: persona.username,
      role: persona.role,
      isReadOnly: persona.isReadOnly,
      mustChangePassword: persona.hasTemporaryPassword,
    });
  });

  it('covers an admin, a member, a read-only one of each and a temporary password', () => {
    const kinds = DEV_PERSONAS.map(({ role, isReadOnly, hasTemporaryPassword }) => ({
      role,
      isReadOnly,
      hasTemporaryPassword,
    }));

    expect(kinds).toEqual([
      { role: UserRoleUtil.ADMIN, isReadOnly: false, hasTemporaryPassword: false },
      { role: UserRoleUtil.MEMBER, isReadOnly: false, hasTemporaryPassword: false },
      { role: UserRoleUtil.MEMBER, isReadOnly: true, hasTemporaryPassword: false },
      { role: UserRoleUtil.ADMIN, isReadOnly: true, hasTemporaryPassword: false },
      { role: UserRoleUtil.MEMBER, isReadOnly: false, hasTemporaryPassword: true },
    ]);
  });
});

describe('the persona start commands (VITE_MOCK_PERSONA)', () => {
  it('shows the member their submissions in every state', async () => {
    setMockPersona(MockPersona.MEMBER);

    const { data } = await submissionService.getSubmissions({ pagination: EVERY_PAGE });
    const states = data.map(({ status, reviewedAt, changedByAdminAt }) => ({
      status,
      wasReviewed: reviewedAt !== null,
      wasChangedByAdmin: changedByAdminAt !== null,
    }));

    expect(states).toEqual(
      expect.arrayContaining([
        { status: SubmissionStatusUtil.WAITING, wasReviewed: false, wasChangedByAdmin: false },
        { status: SubmissionStatusUtil.WAITING, wasReviewed: true, wasChangedByAdmin: false },
        { status: SubmissionStatusUtil.REJECTED, wasReviewed: true, wasChangedByAdmin: false },
        { status: SubmissionStatusUtil.REJECTED, wasReviewed: true, wasChangedByAdmin: true },
        { status: SubmissionStatusUtil.MERGED, wasReviewed: true, wasChangedByAdmin: false },
        { status: SubmissionStatusUtil.APPROVED, wasReviewed: true, wasChangedByAdmin: false },
      ]),
    );
  });

  it('gives the member every notification a member gets, read and unread', async () => {
    setMockPersona(MockPersona.MEMBER);

    const kinds = await notificationKindsSeen();

    expect(kinds).toEqual(
      expect.arrayContaining([
        `${NotificationKindUtil.SUBMISSION_APPROVED} unread`,
        `${NotificationKindUtil.SUBMISSION_REJECTED} unread`,
        `${NotificationKindUtil.SUBMISSION_REJECTED} read`,
        `${NotificationKindUtil.SUBMISSION_MERGED} unread`,
        `${NotificationKindUtil.FUNKO_REMOVED} read`,
      ]),
    );
  });

  it('gives the admin every notification kind, read and unread', async () => {
    setMockPersona(MockPersona.ADMIN);

    const kinds = new Set(await notificationKindsSeen());

    for (const kind of Object.values(NotificationKindUtil)) {
      expect(kinds.has(`${kind} read`) || kinds.has(`${kind} unread`), kind).toBe(true);
    }
    expect([...kinds].some((kind) => kind.endsWith(' unread'))).toBe(true);
    expect([...kinds].some((kind) => kind.endsWith(' read'))).toBe(true);
  });

  it('makes the last-admin persona the only admin who can make changes', async () => {
    setMockPersona(MockPersona.LAST_ADMIN);

    const { data } = await userService.getUsers({ pagination: EVERY_PAGE });
    const lastAdmins = data.filter((user) => user.isLastAdmin).map((user) => user.username);

    expect(lastAdmins).toEqual(['leia']);
  });

  it('opens on a temporary password for the new user', async () => {
    setMockPersona(MockPersona.NEW_USER);

    const status = await authService.getStatus();

    expect(status.user).toMatchObject({ username: 'finn', mustChangePassword: true });
  });
});
