import type { UserApiModel } from '@app-types/models';
import { USER_STATE_LABELS, UserStateUtil } from '@app-types/utility';
import { Badge } from '@components/ui/badge';
import { formatDate } from '@utils/dateUtils';

type Props = {
  user: UserApiModel;
};

type BadgeVariant = 'secondary' | 'outline' | 'destructive';

// Text first, colour second: the label always says the state.
const STATE_VARIANT_MAP: Record<UserStateUtil, BadgeVariant> = {
  [UserStateUtil.ACTIVE]: 'secondary',
  [UserStateUtil.TEMPORARY_PASSWORD]: 'outline',
  [UserStateUtil.TEMPORARY_PASSWORD_EXPIRED]: 'destructive',
  [UserStateUtil.NO_SIGN_IN]: 'outline',
};

// How the user can sign in today; a temporary password says until when it works.
function UserStateBadge({ user }: Props) {
  const isWaiting = user.state === UserStateUtil.TEMPORARY_PASSWORD;
  const expiresAt = isWaiting ? user.temporaryPasswordExpiresAt : null;

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={STATE_VARIANT_MAP[user.state]}>{USER_STATE_LABELS[user.state]}</Badge>
      {expiresAt ? <span className="text-xs text-muted-foreground">Works until {formatDate(expiresAt)}</span> : null}
    </div>
  );
}

export default UserStateBadge;
