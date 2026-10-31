import { ConflictError, NotFoundError } from '../../lib/httpErrors.ts';
import { addFunko } from './funkos.service.ts';

vi.mock('./funkos.repository.ts', () => ({
  funkosRepository: {
    findIdByIdentity: vi.fn(),
    findIdByBarcode: vi.fn(),
    create: vi.fn(),
    findManyByIds: vi.fn(),
    primaryImagesByFunkoIds: vi.fn(),
    collectionsByFunkoIds: vi.fn(),
  },
}));

vi.mock('../categories/categories.service.ts', () => ({
  getCategory: vi.fn(),
}));

const { funkosRepository } = await import('./funkos.repository.ts');
const { getCategory } = await import('../categories/categories.service.ts');

const EXISTING_ID = 42;
const CATEGORY_ID = 1;
const INPUT = { name: 'Thanos', number: '78', categoryId: CATEGORY_ID, seriesId: null, exclusive: '', barcode: null };
const CATEGORY = { id: CATEGORY_ID, name: 'Pop! Marvel', funkoCount: 0, createdAt: '', updatedAt: '' };

describe('addFunko', () => {
  it('throws ConflictError carrying the existing id when the identity is taken', async () => {
    vi.mocked(getCategory).mockResolvedValue(CATEGORY);
    vi.mocked(funkosRepository.findIdByIdentity).mockResolvedValue({ id: EXISTING_ID });

    const attempt = addFunko(INPUT);

    await expect(attempt).rejects.toBeInstanceOf(ConflictError);
    await expect(attempt).rejects.toMatchObject({ code: 'CONFLICT', existingId: EXISTING_ID });
    expect(funkosRepository.create).not.toHaveBeenCalled();
  });

  it('throws a VALIDATION_ERROR when the category does not exist', async () => {
    vi.mocked(getCategory).mockRejectedValue(new NotFoundError('Category', CATEGORY_ID));

    const attempt = addFunko(INPUT);

    await expect(attempt).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      message: `Category ${CATEGORY_ID} does not exist`,
    });
    expect(funkosRepository.findIdByIdentity).not.toHaveBeenCalled();
  });
});
