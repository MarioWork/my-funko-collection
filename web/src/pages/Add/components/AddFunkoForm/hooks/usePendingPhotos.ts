import { useEffect, useRef, useState } from 'react';
import { releasePreviews, toPendingPhotos, type PendingPhoto } from '@utils/pendingPhotoUtils';
import { withViewTransition } from '@utils/viewTransitionUtils';

// The photos picked for a funko that does not exist yet. They are sent with the form; the previews are given back
// when the form goes away (saved, or left), so a long scanning session does not keep every photo in memory.
export function usePendingPhotos() {
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const latestPhotos = useRef<PendingPhoto[]>([]);

  useEffect(() => {
    latestPhotos.current = photos;
  }, [photos]);

  useEffect(() => () => releasePreviews(latestPhotos.current), []);

  const add = (files: File[]) => setPhotos((current) => [...current, ...toPendingPhotos(files)]);

  const remove = (photo: PendingPhoto) => {
    releasePreviews([photo]);
    setPhotos((current) => current.filter((candidate) => candidate.id !== photo.id));
  };

  // The first photo is the main one (the grid shows it), so making one main moves it to the front, gliding there.
  const makeMain = (photo: PendingPhoto) =>
    withViewTransition(() =>
      setPhotos((current) => [photo, ...current.filter((candidate) => candidate.id !== photo.id)]),
    );

  return { photos, add, remove, makeMain };
}
