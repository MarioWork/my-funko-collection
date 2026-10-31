import type { Locator, Page } from '@playwright/test';
import { SUBMISSION_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

export class SubmissionsPage {
  readonly heading: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Submissions' });
  }

  async goto() {
    await this.page.goto(SUBMISSION_ROUTES_PATHS.BASE);
  }

  // The table row of one submission, found by the link to its funko.
  row(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('link', { name, exact: true }) });
  }
}
