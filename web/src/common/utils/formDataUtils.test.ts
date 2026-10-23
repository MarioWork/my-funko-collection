import { createFormData, parseFormData } from './formDataUtils';

type FileForm = { file: File };

describe('createFormData', () => {
  it('round-trips strings, numbers, booleans and objects', () => {
    const data = { name: 'Notebook', quantity: 3, isActive: true, item: { name: 'Pen' } };

    const parsed = parseFormData<typeof data>(createFormData(data));

    expect(parsed).toEqual(data);
  });

  it('skips undefined and null values', () => {
    const parsed = parseFormData<Record<string, unknown>>(createFormData({ name: 'Pen', note: undefined, tag: null }));

    expect(parsed).toEqual({ name: 'Pen' });
  });
});

describe('parseFormData', () => {
  it('keeps a file as a file', () => {
    const file = new File(['content'], 'notes.txt');

    const parsed = parseFormData<FileForm>(createFormData({ file }));

    expect(parsed.file).toBeInstanceOf(File);
    expect(parsed.file.name).toBe('notes.txt');
  });
});
