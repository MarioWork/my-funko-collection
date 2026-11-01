import { yupResolver } from '@hookform/resolvers/yup';
import { Trash2 } from 'lucide-react';
import { useFetcher } from 'react-router';
import type { FunkoDetailApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import CancelButton from '@components/CancelButton';
import InlineAlert from '@components/InlineAlert';
import ReasonField from '@components/ReasonField';
import SubmitButton from '@components/SubmitButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { useFormCompat } from '@hooks/useFormCompat';
import { RemoveFunkoSchema, type RemoveFunko } from '@services/funkoService/funkoService.type';
import { GENERIC_WRITE_ERROR } from '@utils/errorMessageUtils';
import { createFormData } from '@utils/formDataUtils';
import { describeOtherHolders } from '../funkoDetailUtils';

type Props = {
  funko: FunkoDetailApiModel;
  // How many users other than the signed-in one have it in a collection.
  otherUserCount: number;
  isOpen: boolean;
  onClose: () => void;
};

const FORM_ID = 'remove-funko';
const REASON_HINT = 'Each of them reads this in their notifications.';
const DEFAULT_VALUES: RemoveFunko = { reason: '' };

// Deleting a funko other users have: the admin sees how many have it (never who) and writes why. It goes from every
// collection, and each user who had it is told the reason. Success leaves the page (the action redirects).
function FunkoRemoveDialog({ funko, otherUserCount, isOpen, onClose }: Props) {
  const fetcher = useFetcher<JSONResponseUtil>();
  const isSaving = fetcher.state !== 'idle';
  const hasFailed = fetcher.data?.success === false;
  const { control, handleSubmit } = useFormCompat<RemoveFunko>({
    defaultValues: DEFAULT_VALUES,
    resolver: yupResolver(RemoveFunkoSchema),
  });

  const onSubmit = handleSubmit(({ reason }) =>
    fetcher.submit(createFormData({ force: true, reason }), {
      method: HttpVerbsUtil.DELETE,
      action: FUNKO_ROUTES_PATHS.delete(String(funko.id)),
    }),
  );

  const changeOpen = (open: boolean) => {
    if (!open && !isSaving) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={changeOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {funko.name}?</DialogTitle>
          <DialogDescription>
            {describeOtherHolders(otherUserCount)}. Deleting it removes it from every collection, with its images, and
            tells each of them why. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <form id={FORM_ID} onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
          <ReasonField control={control} idPrefix={FORM_ID} hint={REASON_HINT} />
          {hasFailed ? (
            <InlineAlert tone="error">{fetcher.data?.error?.message ?? GENERIC_WRITE_ERROR}</InlineAlert>
          ) : null}
        </form>
        <DialogFooter>
          <CancelButton isSubmitting={isSaving} onCancel={onClose} />
          <SubmitButton
            isSubmitting={isSaving}
            form={FORM_ID}
            isDestructive
            icon={<Trash2 data-icon="inline-start" aria-hidden="true" />}
          >
            Delete
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FunkoRemoveDialog;
