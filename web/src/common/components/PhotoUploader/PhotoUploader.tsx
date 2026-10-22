import { Camera, ImagePlus, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import InlineAlert from '@components/InlineAlert';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { useActionToast } from '@hooks/useActionToast';
import {
  LIBRARY_ACCEPT,
  MAX_PHOTOS_PER_BATCH,
  prepareUpload,
  releasePreviews,
  toPendingPhotos,
  type PendingPhoto,
} from './photoUploaderUtils';
import PendingPhotoList from './components/PendingPhotoList';

type Props = {
  // The images action of the funko: POST with the files under the "file" field.
  actionPath: string;
  onUploaded?: () => void;
};

// Pick from the library (several) or take one photo, see previews, upload in one batch. Photos are resized on the
// phone first; the server makes the three variants. Owns its fetcher, as a writing component should.
function PhotoUploader({ actionPath, onUploaded }: Props) {
  const fetcher = useFetcher<JSONResponseUtil<unknown[]>>();
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const libraryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const isUploading = isPreparing || fetcher.state !== 'idle';
  const hasFailed = fetcher.state === 'idle' && fetcher.data?.success === false;
  const canAddMore = pending.length < MAX_PHOTOS_PER_BATCH;

  useActionToast(fetcher, {
    successMessage: (data) => `${Array.isArray(data) ? data.length : 1} photo(s) added`,
  });

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_PHOTOS_PER_BATCH - pending.length);

    setPending((current) => [...current, ...toPendingPhotos(files)]);
    // iOS replaces input.files each time; clearing lets the same picker add again.
    event.target.value = '';
  };

  const remove = (photo: PendingPhoto) => {
    releasePreviews([photo]);
    setPending((current) => current.filter((candidate) => candidate.id !== photo.id));
  };

  const upload = async () => {
    setIsPreparing(true);

    const body = await prepareUpload(pending);

    setIsPreparing(false);
    await fetcher.submit(body, { method: HttpVerbsUtil.POST, action: actionPath, encType: 'multipart/form-data' });
    releasePreviews(pending);
    setPending([]);
    onUploaded?.();
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={libraryInput}
        type="file"
        accept={LIBRARY_ACCEPT}
        multiple
        className="sr-only"
        aria-label="Photo files"
        onChange={addFiles}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/jpeg"
        capture="environment"
        className="sr-only"
        aria-label="Camera photo"
        onChange={addFiles}
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!canAddMore || isUploading} onClick={() => libraryInput.current?.click()}>
          <ImagePlus data-icon="inline-start" aria-hidden="true" />
          Choose photos
        </Button>
        <Button
          variant="outline"
          className="pointer-fine:hidden"
          disabled={!canAddMore || isUploading}
          onClick={() => cameraInput.current?.click()}
        >
          <Camera data-icon="inline-start" aria-hidden="true" />
          Take photo
        </Button>
        {pending.length > 0 ? (
          <Button disabled={isUploading} onClick={() => void upload()}>
            {isUploading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Upload data-icon="inline-start" aria-hidden="true" />
            )}
            Upload {pending.length} photo{pending.length === 1 ? '' : 's'}
          </Button>
        ) : null}
      </div>
      <PendingPhotoList photos={pending} isDisabled={isUploading} onRemove={remove} />
      {hasFailed ? (
        <InlineAlert tone="error">{fetcher.data?.error?.message ?? 'The upload failed. Please try again.'}</InlineAlert>
      ) : null}
    </div>
  );
}

export default PhotoUploader;
