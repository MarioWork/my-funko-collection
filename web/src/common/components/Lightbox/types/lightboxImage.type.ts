// What the viewer needs of an image: a stored funko image (with its medium size and dimensions), or a photo picked
// but not uploaded yet (a local preview, nothing else known).
export type LightboxImage = {
  id: number | string;
  url: string;
  mediumUrl?: string;
  width?: number;
  height?: number;
};
