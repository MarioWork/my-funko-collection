import type { Locator, Page } from '@playwright/test';

type ConfirmDeleteOptions = { alsoRemoveFromCollections: boolean };

export class FunkoDetailPage {
  readonly title: Locator;
  // The delete confirmation, once openDeleteDialog() has opened it.
  readonly deleteDialog: Locator;
  // The delete dialog for a funko other users have, which asks why, once openDeleteDialog() has opened it.
  readonly removeDialog: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole('heading', { level: 1 });
    this.deleteDialog = page.getByRole('alertdialog');
    this.removeDialog = page.getByRole('dialog', { name: /^Delete / });
  }

  // The dialog's "Also remove it from <collection>" checkbox, shown while the funko is in a collection.
  removeFromCollectionCheckbox(collectionName: string): Locator {
    return this.deleteDialog.getByRole('checkbox', { name: `Also remove it from ${collectionName}` });
  }

  // An item of the open ⋯ menu.
  menuItem(name: string): Locator {
    return this.page.getByRole('menuitem', { name, exact: true });
  }

  // The funko's own ⋯ menu; each collection row has one too ("Actions for Owned").
  async openActionsMenu(funkoName: string) {
    await this.page
      .getByRole('main')
      .getByRole('button', { name: `Actions for ${funkoName}`, exact: true })
      .click();
  }

  async hoverMenuItem(name: string) {
    await this.menuItem(name).hover();
  }

  async openDeleteDialog(funkoName: string) {
    await this.openActionsMenu(funkoName);
    await this.menuItem('Delete').click();
  }

  async confirmDelete({ alsoRemoveFromCollections }: ConfirmDeleteOptions) {
    if (alsoRemoveFromCollections)
      await this.deleteDialog.getByRole('checkbox', { name: /^Also remove it from / }).check();

    await this.deleteDialog.getByRole('button', { name: 'Delete' }).click();
  }

  async confirmRemove(reason: string) {
    await this.removeDialog.getByRole('textbox', { name: 'Why?' }).fill(reason);
    await this.removeDialog.getByRole('button', { name: 'Delete' }).click();
  }
}
