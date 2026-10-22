import type { Locator, Page } from '@playwright/test';
import { COLLECTION_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

export class CollectionDetailPage {
  readonly rows: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.rows = page.getByRole('table').getByRole('row');
  }

  async goto(collectionId: string) {
    await this.page.goto(COLLECTION_ROUTES_PATHS.detail(collectionId));
  }

  async openAddItem() {
    await this.page.getByRole('link', { name: 'Add item' }).click();
  }

  async pickFunko(typed: string, optionName: string | RegExp) {
    const dialog = this.page.getByRole('dialog');

    await dialog.getByRole('combobox', { name: 'Funko' }).fill(typed);
    await this.page.getByRole('option', { name: optionName }).first().click();
  }

  async addTag(name: string) {
    const dialog = this.page.getByRole('dialog');

    await dialog.getByRole('combobox', { name: 'Tags' }).fill(name);
    await this.page.getByRole('option', { name }).click();
  }

  async submitAddItem() {
    await this.page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click();
  }

  rowFor(funkoName: string) {
    return this.rows.filter({ hasText: funkoName });
  }
}
