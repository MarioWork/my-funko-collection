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

  // Adding and removing glide too: the thumbnails and the sections below make room or close the gap smoothly.
  const add = (files: File[]) =>
    void withViewTransition(() => setPhotos((current) => [...current, ...toPendingPhotos(files)]));

  const removeGliding = async (photo: PendingPhoto) => {
    await withViewTransition(() => setPhotos((current) => current.filter((candidate) => candidate.id !== photo.id)));
    // The preview is released once the transition no longer shows it.
    releasePreviews([photo]);
  };

  const remove = (photo: PendingPhoto) => void removeGliding(photo);

  // The first photo is the main one (the grid shows it), so making one main moves it to the front, gliding there.
  const makeMain = (photo: PendingPhoto) =>
    withViewTransition(() =>
      setPhotos((current) => [photo, ...current.filter((candidate) => candidate.id !== photo.id)]),
    );

  return { photos, add, remove, makeMain };
}
