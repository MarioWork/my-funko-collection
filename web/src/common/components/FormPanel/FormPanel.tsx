import { useEffect, useRef, type ReactNode } from 'react';
import PageHeader from '@components/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { useIsDesktop } from '@hooks/useMediaQuery';
import { cn } from '@utils/classNameUtils';

type Props = {
  title: string;
  description?: string;
  // Closing: the dialog's ✕ and Escape on desktop, the Back button on phones. Usually navigates back.
  onClose: () => void;
  // The Cancel / Save buttons. Left out when the content brings its own (the Add flow).
  footer?: ReactNode;
  // Wider dialog for long forms.
  isWide?: boolean;
  // When it changes (the next step of a flow), the panel scrolls back to its top.
  scrollKey?: string;
  children: ReactNode;
};

// A routed form's surface: a dialog over the page on desktop, its own page on phones (the parent steps aside
// through useMobileChildPage). The form inside is the same in both.
function FormPanel({ title, description, onClose, footer, isWide = false, scrollKey, children }: Props) {
  const isDesktop = useIsDesktop();
  const dialogRef = useRef<HTMLDivElement>(null);

  // A new step starts at its top, not where the last one was scrolled to (the Save button at the bottom).
  useEffect(() => {
    if (isDesktop) {
      dialogRef.current?.scrollTo({ top: 0 });

      return;
    }

    window.scrollTo({ top: 0 });
  }, [scrollKey, isDesktop]);

  if (isDesktop) {
    return (
      <Dialog open onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
        <DialogContent
          ref={dialogRef}
          className={cn('max-h-[calc(100dvh-4rem)] overflow-y-auto', isWide && 'sm:max-w-2xl')}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {children}
          {footer ? <DialogFooter>{footer}</DialogFooter> : null}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={title} description={description} onBack={onClose} />
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-4">
        {children}
        {footer ? (
          <div className="sticky bottom-[calc(var(--bottom-nav-height,0px)+env(safe-area-inset-bottom))] -mx-4 -mb-4 flex gap-2 border-t bg-card p-4 *:flex-1">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default FormPanel;
