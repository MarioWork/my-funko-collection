import type { Locator, Page } from '@playwright/test';
import { SUBMISSION_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

type ReviewTabName = 'Waiting' | 'Done';

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

  // Opens the merge dialog; with `search`, picks the first catalogue funko of that name the search finds, else keeps
  // the maybe-double already picked.
  async merge(name: string, search?: { query: string; pick: string }) {
    await this.row(name).getByRole('button', { name: 'Merge' }).click();

    const dialog = this.page.getByRole('dialog', { name: `Merge ${name}?` });

    if (search) {
      await dialog.getByRole('searchbox', { name: 'Search the catalogue' }).fill(search.query);
      await dialog.getByRole('radio', { name: search.pick }).click();
    }

    await dialog.getByRole('button', { name: 'Merge' }).click();
  }
}
