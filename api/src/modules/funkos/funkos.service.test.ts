import { BadRequestError, ConflictError } from '../../lib/httpErrors.ts';
import { addFunko } from './funkos.service.ts';

vi.mock('./funkos.repository.ts', () => ({
  funkosRepository: {
    findIdByIdentity: vi.fn(),
    findIdByBarcode: vi.fn(),
    create: vi.fn(),
    findManyByIds: vi.fn(),
    primaryImagesByFunkoIds: vi.fn(),
    collectionsByFunkoIds: vi.fn(),
    tagNamesByFunkoIds: vi.fn(),
  },
  splitSearchWords: () => [],
}));

vi.mock('../categories/categories.service.ts', () => ({
  assertCategoryExists: vi.fn(),
}));

const { funkosRepository } = await import('./funkos.repository.ts');
const { assertCategoryExists } = await import('../categories/categories.service.ts');

const EXISTING_ID = 42;
const INPUT = { name: 'Thanos', number: '78', categoryId: 1, seriesId: null, exclusive: '', barcode: null };

describe('addFunko', () => {
  it('throws ConflictError carrying the existing id when the identity is taken', async () => {
    vi.mocked(assertCategoryExists).mockResolvedValue(undefined);
    vi.mocked(funkosRepository.findIdByIdentity).mockResolvedValue({ id: EXISTING_ID });

    const attempt = addFunko(INPUT);

    await expect(attempt).rejects.toBeInstanceOf(ConflictError);
    await expect(attempt).rejects.toMatchObject({ code: 'CONFLICT', existingId: EXISTING_ID });
    expect(funkosRepository.create).not.toHaveBeenCalled();
  });

  it('throws a VALIDATION_ERROR when the category does not exist', async () => {
    vi.mocked(assertCategoryExists).mockRejectedValue(new BadRequestError('Category 1 does not exist'));

    await expect(addFunko(INPUT)).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 });
    expect(funkosRepository.findIdByIdentity).not.toHaveBeenCalled();
  });
});
