import { funkoIdOfUploadPath } from './imageStorage.ts';

describe('funkoIdOfUploadPath', () => {
  it('returns the funko folder when the path points at one of its files', () => {
    expect(funkoIdOfUploadPath('/uploads/funkos/12/abc.sm.webp?v=1')).toBe(12);
  });

  it('returns the folder the file server will open when the path walks out with an encoded ..', () => {
    expect(funkoIdOfUploadPath('/uploads/funkos/1/..%2F2/abc.webp')).toBe(2);
  });

  it('returns undefined when the path leaves the funkos folder or names no id', () => {
    expect(funkoIdOfUploadPath('/uploads/funkos/1/../../other/abc.webp')).toBeUndefined();
    expect(funkoIdOfUploadPath('/uploads/funkos/loose/abc.webp')).toBeUndefined();
    expect(funkoIdOfUploadPath('/uploads/funkos/%E0%A4%A/abc.webp')).toBeUndefined();
  });
});
