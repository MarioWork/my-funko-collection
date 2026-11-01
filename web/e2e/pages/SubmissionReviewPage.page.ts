import type { Locator, Page } from '@playwright/test';
import { SUBMISSION_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

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

  async openTab(name: 'Waiting' | 'Done') {
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
}
