import tagService from './tagService';

describe('addTag', () => {
  it('creates the tag and lists it afterwards', async () => {
    const created = await tagService.addTag({ name: 'Box 4', notes: 'Attic' });
    const list = await tagService.getTags({ pagination: { page: '1', size: '10' } });

    expect(created.data).toMatchObject({ name: 'Box 4', notes: 'Attic', itemCount: 0 });
    expect(list.data.map((tag) => tag.name)).toContain('Box 4');
  });

  it('returns the 409 envelope for a taken name', async () => {
    const result = await tagService.addTag({ name: 'Box 1', notes: null });

    expect(result).toMatchObject({ success: false, error: { statusCode: 409 } });
  });
});
