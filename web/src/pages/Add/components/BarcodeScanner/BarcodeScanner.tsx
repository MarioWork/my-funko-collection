import { Flashlight, FlashlightOff } from 'lucide-react';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { cn } from '@utils/classNameUtils';
import ManualCodeForm from './components/ManualCodeForm';
import { ScannerStateUtil, useBarcodeScanner } from './hooks/useBarcodeScanner';

type Props = {
  isActive: boolean;
  onDetected: (barcode: string) => void;
  className?: string;
};

const STATE_MESSAGES: Partial<Record<ScannerStateUtil, string>> = {
  [ScannerStateUtil.DENIED]:
    'Camera access was refused. Allow it in the browser settings (iPhone: Settings › Apps › Safari › Camera), or type the code.',
  [ScannerStateUtil.NO_CAMERA]: 'No camera found on this device. Type the code instead.',
  [ScannerStateUtil.INSECURE]:
    'The camera only works over HTTPS. Open the app through its https:// address, or type the code.',
  [ScannerStateUtil.FAILED]: 'The camera could not start. Try again, or type the code.',
};

// Viewfinder with a generous read window, a torch when the phone has one, and manual entry always one tap away.
function BarcodeScanner({ isActive, onDetected, className }: Props) {
  const { videoRef, state, hasTorch, isTorchOn, toggleTorch } = useBarcodeScanner({ isActive, onDetected });
  const message = STATE_MESSAGES[state];
  const isScanning = state === ScannerStateUtil.SCANNING;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-2xl bg-media @md:aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="size-full object-cover"
          aria-label="Camera preview"
        />
        {isScanning ? (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute inset-x-[10%] top-[35%] h-[30%] rounded-lg border-2 border-media-foreground/90 shadow-viewfinder" />
            <div className="absolute inset-x-[12%] top-1/2 h-0.5 bg-primary/90 motion-safe:animate-pulse" />
          </div>
        ) : null}
        {state === ScannerStateUtil.STARTING ? (
          <div className="absolute inset-0 flex items-center justify-center text-media-foreground">
            <Spinner className="size-8" />
          </div>
        ) : null}
        {hasTorch ? (
          <Button
            variant="secondary"
            size="icon-lg"
            aria-label={isTorchOn ? 'Turn torch off' : 'Turn torch on'}
            aria-pressed={isTorchOn}
            className="absolute right-3 bottom-3"
            onClick={() => void toggleTorch()}
          >
            {isTorchOn ? <FlashlightOff aria-hidden="true" /> : <Flashlight aria-hidden="true" />}
          </Button>
        ) : null}
      </div>
      {isScanning ? <p className="text-center text-sm text-muted-foreground">Point at the barcode on the box</p> : null}
      {message ? <InlineAlert tone="info">{message}</InlineAlert> : null}
      <ManualCodeForm onSubmitCode={onDetected} />
    </div>
  );
}

export default BarcodeScanner;
