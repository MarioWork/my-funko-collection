import type { Locator, Page } from '@playwright/test';
import { ADD_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

type FunkoDetails = {
  name: string;
  number: string;
  categoryName: string;
  seriesName: string;
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

  async fillDetails({ name, number, categoryName, seriesName }: FunkoDetails) {
    await this.page.getByLabel('Name', { exact: true }).fill(name);
    await this.page.getByLabel('Number', { exact: true }).fill(number);
    await this.page.getByLabel('Category', { exact: true }).selectOption({ label: categoryName });
    await this.page.getByLabel('Series', { exact: true }).selectOption({ label: seriesName });
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

  // One card per picked collection, named by its heading. A folded card's heading row also shows a summary
  // ("Owned ×1"), so match the start of each.
  pickedCollections() {
    return this.main.getByRole('article').getByRole('heading', { level: 3 });
  }

  // Picking another collection folds the others, so the card is unfolded first when it needs to be.
  async fillPrice(collectionName: string, price: string) {
    const card = this.main.getByRole('article', { name: collectionName });
    const toggle = card.getByRole('button', { name: collectionName, exact: true });
    const isFolded = (await toggle.getAttribute('aria-expanded')) === 'false';

    if (isFolded) await toggle.click();

    await card.getByLabel('Paid (EUR)').fill(price);
  }

  async pickCollection(name: string) {
    await this.main.getByRole('combobox', { name: 'Add to collections' }).fill(name);
    await this.page.getByRole('option', { name }).click();
  }

  // Backspace in the empty input drops the last chip.
  async dropLastCollection() {
    const input = this.main.getByRole('combobox', { name: 'Add to collections' });

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
