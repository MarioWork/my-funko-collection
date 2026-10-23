import { useEffect, useRef, useState } from 'react';
import { isCameraAvailable, normaliseBarcode } from '@utils/barcodeUtils';

export const ScannerStateUtil = {
  IDLE: 'idle',
  STARTING: 'starting',
  SCANNING: 'scanning',
  DENIED: 'denied',
  NO_CAMERA: 'no-camera',
  INSECURE: 'insecure',
  FAILED: 'failed',
} as const;
export type ScannerStateUtil = (typeof ScannerStateUtil)[keyof typeof ScannerStateUtil];

type Options = {
  isActive: boolean;
  onDetected: (barcode: string) => void;
};

type DetectedBarcode = { rawValue: string };

type Detector = { detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]> };

// 1D retail formats only: faster, fewer false reads.
const FORMATS = ['ean_13', 'upc_a', 'upc_e', 'ean_8'] as const;
const DETECT_INTERVAL_MS = 150;
// Two agreeing frames before a read counts: cuts misreads on glossy boxes.
const CONFIRMATIONS_NEEDED = 2;
// The centre band of the frame; a barcode is wide and short, and a smaller region decodes faster.
const CROP_WIDTH_RATIO = 0.8;
const CROP_HEIGHT_RATIO = 0.3;
const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1280 },
  height: { ideal: 720 },
};
// Under the app's base path, so the reader is found when the site lives in a sub-folder (GitHub Pages).
const WASM_PATH = `${import.meta.env.BASE_URL}wasm/`;

// Loaded on demand so the ~1 MB reader stays out of every other page's bundle. The ponyfill runs everywhere:
// Safari's native detector is off by default and broken behind its flag.
async function loadDetector(): Promise<Detector> {
  const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill');

  prepareZXingModule({ overrides: { locateFile: (file: string) => `${WASM_PATH}${file}` } });

  return new BarcodeDetector({ formats: [...FORMATS] });
}

// A new value restarts the count; the same value again counts up; no value resets it.
function countAgreeingFrames(current: number, previous: string, value: string): number {
  if (!value) return 0;

  return value === previous ? current + 1 : 1;
}

function stopStream(stream: MediaStream | null): void {
  for (const track of stream?.getTracks() ?? []) track.stop();
}

// The camera errors (DOMException names) that have their own message; any other is a plain failure.
const ERROR_STATE_MAP: Record<string, ScannerStateUtil> = {
  NotAllowedError: ScannerStateUtil.DENIED,
  SecurityError: ScannerStateUtil.DENIED,
  NotFoundError: ScannerStateUtil.NO_CAMERA,
  OverconstrainedError: ScannerStateUtil.NO_CAMERA,
};

function toScannerState(error: unknown): ScannerStateUtil {
  const name = error instanceof DOMException ? error.name : '';

  return ERROR_STATE_MAP[name] ?? ScannerStateUtil.FAILED;
}

// Owns the camera stream, the detector and the frame loop. Hands back a ref for the <video> and the state.
export function useBarcodeScanner({ isActive, onDetected }: Options) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<ScannerStateUtil>(ScannerStateUtil.IDLE);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const onDetectedRef = useRef(onDetected);
  // Decided during render, not in an effect: the camera API is either there and secure, or it is not.
  const isAvailable = isCameraAvailable();
  const unavailableState = window.isSecureContext ? ScannerStateUtil.NO_CAMERA : ScannerStateUtil.INSECURE;

  useEffect(() => {
    onDetectedRef.current = onDetected;
  });

  useEffect(() => {
    if (!isActive || !isAvailable) return undefined;

    const video = videoRef.current;
    let isCancelled = false;
    let lastRead = '';
    let agreeingFrames = 0;
    let lastDetectAt = 0;
    let frameHandle = 0;
    const canvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(1, 1) : null;

    const detectFrame = async (video: HTMLVideoElement, detector: Detector) => {
      const context = canvas?.getContext('2d');

      if (!canvas || !context || video.videoWidth === 0) return;

      const cropWidth = Math.round(video.videoWidth * CROP_WIDTH_RATIO);
      const cropHeight = Math.round(video.videoHeight * CROP_HEIGHT_RATIO);
      const cropX = Math.round((video.videoWidth - cropWidth) / 2);
      const cropY = Math.round((video.videoHeight - cropHeight) / 2);

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const [first] = await detector.detect(canvas);
      const value = first ? normaliseBarcode(first.rawValue) : '';

      agreeingFrames = countAgreeingFrames(agreeingFrames, lastRead, value);
      lastRead = value;

      if (value && agreeingFrames >= CONFIRMATIONS_NEEDED) {
        agreeingFrames = 0;
        onDetectedRef.current(value);
      }
    };

    const start = async () => {
      setState(ScannerStateUtil.STARTING);

      try {
        const [detector, stream] = await Promise.all([
          loadDetector(),
          navigator.mediaDevices.getUserMedia({ audio: false, video: VIDEO_CONSTRAINTS }),
        ]);
        if (isCancelled || !video) {
          stopStream(stream);

          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        const [track] = stream.getVideoTracks();
        const capabilities = track?.getCapabilities() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;

        setHasTorch(Boolean(capabilities?.torch));
        setState(ScannerStateUtil.SCANNING);

        const loop = (now: number) => {
          if (isCancelled) return;

          if (now - lastDetectAt >= DETECT_INTERVAL_MS) {
            lastDetectAt = now;
            void detectFrame(video, detector);
          }

          frameHandle = video.requestVideoFrameCallback
            ? video.requestVideoFrameCallback(() => loop(performance.now()))
            : window.requestAnimationFrame(loop);
        };

        loop(performance.now());
      } catch (error: unknown) {
        if (!isCancelled) setState(toScannerState(error));
      }
    };

    void start();

    return () => {
      isCancelled = true;

      if (video?.requestVideoFrameCallback && video.cancelVideoFrameCallback)
        video.cancelVideoFrameCallback(frameHandle);
      else window.cancelAnimationFrame(frameHandle);

      stopStream(streamRef.current);
      streamRef.current = null;
      setIsTorchOn(false);
      setState(ScannerStateUtil.IDLE);
    };
  }, [isActive, isAvailable]);

  const toggleTorch = async () => {
    const [track] = streamRef.current?.getVideoTracks() ?? [];

    if (!track) return;

    const next = !isTorchOn;

    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setIsTorchOn(next);
    } catch {
      setHasTorch(false);
    }
  };

  const effectiveState = isActive && !isAvailable ? unavailableState : state;

  return { videoRef, state: effectiveState, hasTorch, isTorchOn, toggleTorch };
}
