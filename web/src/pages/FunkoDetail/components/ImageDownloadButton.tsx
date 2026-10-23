import { Download } from 'lucide-react';
import { useState } from 'react';
import IconButton from '@components/IconButton';
import { Spinner } from '@components/ui/spinner';
import { toast } from '@components/ui/toast';
import { DISABLED_REASONS } from '@utils/disabledReasonUtils';
import { downloadImageAsJpeg } from '@utils/imageDownloadUtils';

type Props = {
  url: string;
  funkoName: string;
  // 1-based, for the file name.
  imageNumber: number;
};

const NON_FILENAME_CHARACTERS = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-|-$/g;
const DOWNLOAD_FAILED_MESSAGE = 'The image could not be downloaded.';

// "Eleven", image 2 → "eleven-2.jpg": the funko's name, safe for any file system.
function downloadFileName(funkoName: string, imageNumber: number): string {
  const slug = funkoName.toLowerCase().replace(NON_FILENAME_CHARACTERS, '-').replace(EDGE_DASHES, '');

  return `${slug || 'funko'}-${imageNumber}.jpg`;
}

// Saves the shown image at full size (2000 px) as a JPEG, converted in the browser. Spins while it works; a
// failure says so in a toast. It sits on the frame, beside (not inside) the button that opens the viewer.
function ImageDownloadButton({ url, funkoName, imageNumber }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const fileName = downloadFileName(funkoName, imageNumber);

  const save = async () => {
    setIsSaving(true);

    try {
      await downloadImageAsJpeg(url, fileName);
    } catch {
      toast.add({ title: DOWNLOAD_FAILED_MESSAGE, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IconButton
      aria-label="Download image"
      variant="outline"
      size="sm"
      className="absolute right-2 bottom-2 rounded-full bg-card/90 shadow-sm backdrop-blur-sm"
      disabled={isSaving}
      disabledReason={DISABLED_REASONS.DOWNLOADING}
      onClick={() => void save()}
    >
      {isSaving ? <Spinner /> : <Download aria-hidden="true" />}
    </IconButton>
  );
}

export default ImageDownloadButton;
