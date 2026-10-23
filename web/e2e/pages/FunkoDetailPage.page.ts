import type { Locator, Page } from '@playwright/test';

export class FunkoDetailPage {
  readonly title: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole('heading', { level: 1 });
  }

  async openDeleteDialog() {
    await this.page
      .getByRole('main')
      .getByRole('button', { name: /^Actions for / })
      .click();
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
  }

  async confirmDelete({ alsoRemoveFromCollections }: { alsoRemoveFromCollections: boolean }) {
    const dialog = this.page.getByRole('alertdialog');

    if (alsoRemoveFromCollections) await dialog.getByRole('checkbox').check();

    await dialog.getByRole('button', { name: 'Delete' }).click();
  }
}
