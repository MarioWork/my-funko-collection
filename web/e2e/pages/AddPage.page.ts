import type { Locator, Page } from '@playwright/test';
import { ADD_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

type FunkoDetails = {
  name: string;
  number: string;
  categoryName: string;
};

export class AddPage {
  readonly main: Locator;
  readonly savedCard: Locator;
  readonly scanResult: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.main = page.getByRole('main');
    this.savedCard = page.getByRole('region', { name: 'Saved' });
    this.scanResult = page.getByRole('region', { name: 'Scan result' });
  }

  async gotoManual() {
    await this.page.goto(ADD_ROUTES_PATHS.MANUAL);
  }

  async goto() {
    await this.page.goto(ADD_ROUTES_PATHS.BASE);
  }

  async fillDetails({ name, number, categoryName }: FunkoDetails) {
    await this.page.getByLabel('Name', { exact: true }).fill(name);
    await this.page.getByLabel('Number', { exact: true }).fill(number);
    await this.page.getByLabel('Category', { exact: true }).selectOption({ label: categoryName });
  }

  async save() {
    await this.main.getByRole('button', { name: 'Save funko' }).click();
  }

  async choosePhotos(paths: string[]) {
    await this.page.getByLabel('Image files').setInputFiles(paths);
  }

  photosToUpload() {
    return this.page.getByRole('list', { name: 'Images to upload' }).getByRole('listitem');
  }

  // Base UI's combobox chips have no role; data-slot is the shadcn wrapper's hook for them.
  pickedCollections() {
    return this.main.locator('[data-slot=combobox-chip]');
  }

  async pickCollection(name: string) {
    await this.main.getByRole('combobox', { name: 'Save to collections' }).fill(name);
    await this.page.getByRole('option', { name }).click();
  }

  // Backspace in the empty input drops the last chip.
  async dropLastCollection() {
    const input = this.main.getByRole('combobox', { name: 'Save to collections' });

    await input.fill('');
    await input.press('Backspace');
  }

  async addAnother() {
    await this.savedCard.getByRole('button', { name: 'Add another' }).click();
  }

  async openSavedFunko(name: string) {
    await this.savedCard.getByRole('link', { name: `Open ${name}` }).click();
  }

  async typeBarcode(code: string) {
    await this.page.getByLabel('Or type the code').fill(code);
    await this.page.getByRole('button', { name: 'Use code' }).click();
  }
}
