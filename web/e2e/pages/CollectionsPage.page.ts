import type { Locator, Page } from '@playwright/test';
import { COLLECTION_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

// The Collections page: its New collection button (in the header on desktop, the round + on phones; role queries
// skip the hidden one) and the reason its tooltip shows while it is disabled.
export class CollectionsPage {
  readonly newCollectionButton: Locator;
  readonly tooltip: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.newCollectionButton = page.getByRole('button', { name: 'New collection' });
    // The reason, as the open tooltip shows it (the screen-reader copy beside the button stays hidden).
    this.tooltip = page.getByText('Your account is read-only.').filter({ visible: true });
  }

  async goto() {
    await this.page.goto(COLLECTION_ROUTES_PATHS.BASE);
  }

  // Keyboard focus on the button, where a keyboard user lands when tabbing to it.
  async tabToNewCollection() {
    await this.newCollectionButton.focus();
  }
}
