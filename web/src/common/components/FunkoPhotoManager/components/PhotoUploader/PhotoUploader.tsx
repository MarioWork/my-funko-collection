import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import InlineAlert from '@components/InlineAlert';
import PhotoPicker from '@components/PhotoPicker';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { useActionToast } from '@hooks/useActionToast';
import { prepareUpload, releasePreviews, toPendingPhotos, type PendingPhoto } from '@utils/pendingPhotoUtils';
import DisabledReason from '@components/DisabledReason';
import { MULTIPART_CONTENT_TYPE } from '@services/funkoImageService/funkoImageService';
import { DISABLED_REASONS, reasonWhen } from '@utils/disabledReasonUtils';

type Props = {
  // The images action of the funko: POST with the files under the "file" field.
  actionPath: string;
  onUploaded?: () => void;
};

const UPLOAD_FAILED_MESSAGE = 'The upload failed. Please try again.';

// Pick photos, see previews, upload in one batch. Photos are resized on the phone first; the server makes the three
// sizes. Owns its fetcher, as a writing component should.
function PhotoUploader({ actionPath, onUploaded }: Props) {
  const fetcher = useFetcher<JSONResponseUtil<unknown[]>>();
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const isUploading = isPreparing || fetcher.state !== 'idle';
  const hasFailed = fetcher.state === 'idle' && fetcher.data?.success === false;

  useActionToast(fetcher, {
    successMessage: (data) => `${Array.isArray(data) ? data.length : 1} image(s) added`,
  });

  const addFiles = (files: File[]) => setPending((current) => [...current, ...toPendingPhotos(files)]);

  const remove = (photo: PendingPhoto) => {
    releasePreviews([photo]);
    setPending((current) => current.filter((candidate) => candidate.id !== photo.id));
  };

  const upload = async () => {
    setIsPreparing(true);

    const body = await prepareUpload(pending);

    setIsPreparing(false);
    await fetcher.submit(body, { method: HttpVerbsUtil.POST, action: actionPath, encType: MULTIPART_CONTENT_TYPE });
    releasePreviews(pending);
    setPending([]);
    onUploaded?.();
  };

  return (
    <div className="flex flex-col gap-3">
      <PhotoPicker photos={pending} isDisabled={isUploading} onAdd={addFiles} onRemove={remove}>
        {pending.length > 0 ? (
          <DisabledReason reason={reasonWhen(isUploading, DISABLED_REASONS.UPLOADING)}>
            <Button disabled={isUploading} onClick={() => void upload()}>
              {isUploading ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Upload data-icon="inline-start" aria-hidden="true" />
              )}
              Upload {pending.length} image{pending.length === 1 ? '' : 's'}
            </Button>
          </DisabledReason>
        ) : null}
      </PhotoPicker>
      {hasFailed ? (
        <InlineAlert tone="error">{fetcher.data?.error?.message ?? UPLOAD_FAILED_MESSAGE}</InlineAlert>
      ) : null}
    </div>
  );
}

export default PhotoUploader;
