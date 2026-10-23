import type { Locator, Page } from '@playwright/test';
import { COLLECTION_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

export class CollectionDetailPage {
  readonly main: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.main = page.getByRole('main');
  }

  async goto(collectionId: string) {
    await this.page.goto(COLLECTION_ROUTES_PATHS.detail(collectionId));
  }

  // Items open in the large grid; the list (a table on desktop, cards on a phone) shows each item's details.
  async showAsList() {
    await this.page.getByRole('button', { name: /^Layout:/ }).click();
    await this.page.getByRole('menuitemradio', { name: /^List/ }).click();
  }

  // One item of the list: a table row on desktop, a list item on a phone. Matched by its funko's own link, so a
  // tag's list item or "Spider-Man (Integrated Suit)" never counts as "Spider-Man".
  itemFor(funkoName: string) {
    const funkoLink = this.page.getByRole('link', { name: funkoName, exact: true });

    return this.main.getByRole('row').or(this.main.getByRole('listitem')).filter({ has: funkoLink });
  }

  // Anything on the page that would add a funko or an item here: a link or button named Add / Scan / Pick.
  addControls() {
    return this.main
      .getByRole('link', { name: /^(Add|Scan|Pick)/ })
      .or(this.main.getByRole('button', { name: /^Add/ }));
  }

  async removeItem(funkoName: string) {
    await this.itemFor(funkoName)
      .getByRole('button', { name: `Actions for ${funkoName}` })
      .click();
    await this.page.getByRole('menuitem', { name: 'Remove', exact: true }).click();
  }

  async undo() {
    await this.page.getByRole('region', { name: 'Notifications' }).getByRole('button', { name: 'Undo' }).click();
  }
}
