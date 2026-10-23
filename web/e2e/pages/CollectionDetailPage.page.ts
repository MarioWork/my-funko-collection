import type { Locator, Page } from '@playwright/test';
import { COLLECTION_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

export class CollectionDetailPage {
  readonly main: Locator;
  readonly rows: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.main = page.getByRole('main');
    this.rows = page.getByRole('table').getByRole('row');
  }

  async goto(collectionId: string) {
    await this.page.goto(COLLECTION_ROUTES_PATHS.detail(collectionId));
  }

  // Items open in the large grid; the list (a table on desktop) shows each item's tags and details.
  async showAsList() {
    await this.page.getByRole('button', { name: /^Layout:/ }).click();
    await this.page.getByRole('menuitemradio', { name: /^List/ }).click();
  }

  rowFor(funkoName: string) {
    return this.rows.filter({ hasText: funkoName });
  }

  // Anything on the page that would add a funko or an item here: a link or button named Add / Scan / Pick.
  addControls() {
    return this.main
      .getByRole('link', { name: /^(Add|Scan|Pick)/ })
      .or(this.main.getByRole('button', { name: /^Add/ }));
  }

  async removeItem(funkoName: string) {
    await this.rowFor(funkoName)
      .getByRole('button', { name: `Actions for ${funkoName}` })
      .click();
    await this.page.getByRole('menuitem', { name: 'Remove', exact: true }).click();
  }

  async undo() {
    await this.page.getByRole('region', { name: 'Notifications' }).getByRole('button', { name: 'Undo' }).click();
  }
}
