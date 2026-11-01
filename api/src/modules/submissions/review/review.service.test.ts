import type { FunkoRow } from '../../funkos/funkos.type.ts';
import { approveSubmission } from './review.service.ts';

vi.mock('../submissions.repository.ts', () => ({
  submissionsRepository: {
    findIdByIdentity: vi.fn(),
    findIdByBarcode: vi.fn(),
    findById: vi.fn(),
    findCatalogueReferences: vi.fn(),
  },
}));

vi.mock('./review.repository.ts', () => ({
  reviewRepository: {
    approve: vi.fn(),
  },
}));

const { submissionsRepository } = await import('../submissions.repository.ts');
const { reviewRepository } = await import('./review.repository.ts');

const MEMBER = { userId: 2, isAdmin: false };
const EXISTING_ID = 42;
const CATEGORY_ID = 1;
const SERIES_ID = 3;

const WAITING_ROW: FunkoRow = {
  id: 7,
  name: 'Thanos',
  number: '78',
  type: 'POP',
  isChase: false,
  exclusive: '',
  barcode: '0889698123456',
  categoryId: CATEGORY_ID,
  categoryName: 'Pop! Marvel',
  seriesId: SERIES_ID,
  seriesName: 'Avengers: Endgame',
  status: 'WAITING',
  submittedById: MEMBER.userId,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('approveSubmission', () => {
  it('throws ConflictError and approves nothing when the submission is no longer waiting', async () => {
    vi.mocked(submissionsRepository.findById).mockResolvedValue({ ...WAITING_ROW, status: 'REJECTED' });

    const attempt = approveSubmission(WAITING_ROW.id);

    await expect(attempt).rejects.toMatchObject({ code: 'CONFLICT', statusCode: 409 });
    expect(reviewRepository.approve).not.toHaveBeenCalled();
  });

  it('checks the identity under the category it will have once approved, and points at the catalogue funko', async () => {
    const approvedCategoryId = 9;
    vi.mocked(submissionsRepository.findById).mockResolvedValue(WAITING_ROW);
    vi.mocked(submissionsRepository.findCatalogueReferences).mockResolvedValue({
      categoryId: approvedCategoryId,
      seriesId: SERIES_ID,
    });
    vi.mocked(submissionsRepository.findIdByIdentity).mockResolvedValue({ id: EXISTING_ID });

    const attempt = approveSubmission(WAITING_ROW.id);

    await expect(attempt).rejects.toMatchObject({ code: 'CONFLICT', existingId: EXISTING_ID });
    expect(submissionsRepository.findIdByIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: approvedCategoryId }),
      { submittedById: null },
    );
    expect(reviewRepository.approve).not.toHaveBeenCalled();
  });
});
