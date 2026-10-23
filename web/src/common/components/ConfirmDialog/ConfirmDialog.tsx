import { useId, useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import InlineAlert from '@components/InlineAlert';
import ConfirmDialogFooter from './components/ConfirmDialogFooter';

// What the user chose besides confirming: the optional extra consent.
type ConfirmChoice = {
  isChecked: boolean;
};

type Props = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  isDestructive?: boolean;
  isPending?: boolean;
  // An optional extra consent, e.g. "Also remove it from Owned and Wishlist" for a forced delete.
  checkboxLabel?: string;
  // Why the last confirm failed, shown in the dialog as an alert (announced by screen readers).
  errorMessage?: string;
  onConfirm: (choice: ConfirmChoice) => void;
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
  errorMessage,
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
        {errorMessage ? <InlineAlert tone="error">{errorMessage}</InlineAlert> : null}
        <ConfirmDialogFooter
          confirmLabel={confirmLabel}
          isDestructive={isDestructive}
          isPending={isPending}
          onConfirm={() => onConfirm({ isChecked })}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;
