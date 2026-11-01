import { ConflictError } from '../../lib/httpErrors.ts';
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
  isUsableCategory: vi.fn(),
}));

vi.mock('../series/series.service.ts', () => ({
  isUsableSeries: vi.fn(),
}));

const { funkosRepository } = await import('./funkos.repository.ts');
const { isUsableCategory } = await import('../categories/categories.service.ts');
const { isUsableSeries } = await import('../series/series.service.ts');

const ADMIN = { userId: 1, isAdmin: true };
const MEMBER = { userId: 2, isAdmin: false };
const EXISTING_ID = 42;
const CATEGORY_ID = 1;
const SERIES_ID = 3;
const INPUT = {
  name: 'Thanos',
  number: '78',
  categoryId: CATEGORY_ID,
  seriesId: SERIES_ID,
  exclusive: '',
  barcode: null,
};

describe('addFunko', () => {
  it('throws ConflictError carrying the existing id when the identity is taken', async () => {
    vi.mocked(isUsableCategory).mockResolvedValue(true);
    vi.mocked(isUsableSeries).mockResolvedValue(true);
    vi.mocked(funkosRepository.findIdByIdentity).mockResolvedValue({ id: EXISTING_ID });

    const attempt = addFunko(ADMIN, INPUT);

    await expect(attempt).rejects.toBeInstanceOf(ConflictError);
    await expect(attempt).rejects.toMatchObject({ code: 'CONFLICT', existingId: EXISTING_ID });
    expect(funkosRepository.create).not.toHaveBeenCalled();
  });

  it('checks the catalogue, then the member’s own waiting ones, when a member sends one in', async () => {
    vi.mocked(isUsableCategory).mockResolvedValue(true);
    vi.mocked(isUsableSeries).mockResolvedValue(true);
    vi.mocked(funkosRepository.findIdByIdentity).mockResolvedValueOnce(undefined).mockResolvedValueOnce({
      id: EXISTING_ID,
    });

    const attempt = addFunko(MEMBER, INPUT);

    await expect(attempt).rejects.toMatchObject({ code: 'CONFLICT', existingId: EXISTING_ID });
    expect(vi.mocked(funkosRepository.findIdByIdentity).mock.calls.map(([, scope]) => scope)).toEqual([
      { submittedById: null },
      { submittedById: MEMBER.userId },
    ]);
  });

  it('throws a VALIDATION_ERROR when the category is not one the funko may use', async () => {
    vi.mocked(isUsableCategory).mockResolvedValue(false);

    const attempt = addFunko(MEMBER, INPUT);

    await expect(attempt).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      message: `Category ${CATEGORY_ID} does not exist`,
    });
    expect(isUsableCategory).toHaveBeenCalledWith(CATEGORY_ID, MEMBER.userId);
    expect(funkosRepository.findIdByIdentity).not.toHaveBeenCalled();
  });
});
