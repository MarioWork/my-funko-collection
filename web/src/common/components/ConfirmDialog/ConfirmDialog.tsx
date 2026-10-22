import { useId, useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { Spinner } from '@components/ui/spinner';

type Props = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  isDestructive?: boolean;
  isPending?: boolean;
  // An optional extra consent, e.g. "Also remove it from Owned and Wishlist" for a forced delete.
  checkboxLabel?: string;
  onConfirm: (options: { isChecked: boolean }) => void;
  onClose: () => void;
};

// A local-state confirmation for anything not undoable. Undoable writes use a toast with Undo instead.
function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  isDestructive = false,
  isPending = false,
  checkboxLabel,
  onConfirm,
  onClose,
}: Props) {
  const [isChecked, setIsChecked] = useState(false);
  const checkboxId = useId();

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {checkboxLabel ? (
          <div className="flex items-center gap-2">
            <Checkbox id={checkboxId} checked={isChecked} onCheckedChange={(value) => setIsChecked(value === true)} />
            <Label htmlFor={checkboxId}>{checkboxLabel}</Label>
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isDestructive ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={() => onConfirm({ isChecked })}
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;
