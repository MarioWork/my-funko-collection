import { expect, test } from '../fixtures/app.fixture';
import { SubmissionReviewPage } from '../pages/SubmissionReviewPage.page';

// The mock seed's other members' waiting submissions.
const LUKES_THANOS = 'Thanos (Infinity Gauntlet)';
const HANS_MANDO = 'Mandalorian with Grogu';

test('an admin approves one submission and rejects another with a reason, and finds both under Done', async ({
  page,
}) => {
  const review = new SubmissionReviewPage(page);

  await review.goto();

  await expect(review.heading).toBeVisible();
  await expect(review.row(LUKES_THANOS)).toContainText('Maybe a double');
  await expect(review.row(LUKES_THANOS)).toContainText('from luke');

  await review.approve(HANS_MANDO);
  await expect(review.row(HANS_MANDO)).toHaveCount(0);

  await review.reject(LUKES_THANOS, 'Already in the catalogue as #78');
  await expect(review.row(LUKES_THANOS)).toHaveCount(0);
  // The seed's orphan submission still waits, from a removed user.
  await expect(review.row('Totoro')).toContainText('from Removed user');

  await review.openTab('Done');

  await expect(review.row(HANS_MANDO)).toContainText('Approved');
  await expect(review.row(LUKES_THANOS)).toContainText('Rejected');
  await expect(review.row(LUKES_THANOS)).toContainText('Already in the catalogue as #78');
});

test('an admin merges a submission into a catalogue funko found by search, and finds it merged under Done', async ({
  page,
}) => {
  const review = new SubmissionReviewPage(page);

  await review.goto();
  await review.merge(HANS_MANDO, { query: 'Grogu', pick: '#368 Grogu Pop! Star Wars' });

  await expect(review.row(HANS_MANDO)).toHaveCount(0);
  await review.openTab('Done');
  await expect(review.row(HANS_MANDO)).toContainText('Merged');
  await expect(review.row(HANS_MANDO).getByRole('link', { name: 'Grogu', exact: true })).toBeVisible();
});
