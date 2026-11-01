import type { Locator, Page } from '@playwright/test';
import { SUBMISSION_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

type ReviewTabName = 'Waiting' | 'Done';

type MergeOptions = {
  linkName?: string;
  search?: { query: string; pick: string };
  // Field legends ("Name") whose value is taken from the submission.
  fieldsFromSubmission?: string[];
  // Image checkboxes ("Submission image 1") ticked to move onto the catalogue funko.
  submissionImages?: string[];
};

// The admins' Submissions page: every member's, Waiting and Done.
export class SubmissionReviewPage {
  readonly heading: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Submissions' });
  }

  async goto() {
    await this.page.goto(SUBMISSION_ROUTES_PATHS.REVIEW);
  }

  // The table row of one submission, found by the link to its funko.
  row(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('link', { name, exact: true }) });
  }

  async openTab(name: ReviewTabName) {
    await this.page.getByRole('tab', { name }).click();
  }

  async approve(name: string) {
    await this.row(name).getByRole('button', { name: 'Approve' }).click();
  }

  async reject(name: string, reason: string) {
    await this.row(name).getByRole('button', { name: 'Reject' }).click();

    const dialog = this.page.getByRole('dialog', { name: `Reject ${name}?` });

    await dialog.getByLabel('Why?').fill(reason);
    await dialog.getByRole('button', { name: 'Reject' }).click();
  }

  // Merges one submission that opens on the pick step (several maybe-doubles, or none): opens the dialog from its row
  // (`linkName`: "Merge", or "This is a double of…" with no maybe-double), picks a catalogue funko through `search`
  // (else keeps the one already picked), and on the side-by-side step takes the named fields and images from the
  // submission before merging.
  async merge(name: string, options: MergeOptions = {}) {
    const { linkName = 'Merge', search, fieldsFromSubmission = [], submissionImages = [] } = options;

    await this.row(name).getByRole('link', { name: linkName }).click();

    const dialog = this.page.getByRole('dialog', { name: `Merge ${name}?` });

    if (search) {
      await dialog.getByRole('searchbox', { name: 'Search the catalogue' }).fill(search.query);
      await dialog.getByRole('radio', { name: search.pick }).click();
    }

    await dialog.getByRole('button', { name: 'Next' }).click();

    for (const field of fieldsFromSubmission) {
      await dialog
        .getByRole('radiogroup', { name: field })
        .getByRole('radio', { name: /^Submission/ })
        .click();
    }

    for (const image of submissionImages) {
      await dialog.getByRole('checkbox', { name: image }).click();
    }

    await dialog.getByRole('button', { name: 'Merge' }).click();
  }
}
