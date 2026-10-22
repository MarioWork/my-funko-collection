import type { Locator, Page } from '@playwright/test';
import { ADD_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

type FunkoDetails = {
  name: string;
  number: string;
  categoryName: string;
};

export class AddPage {
  readonly main: Locator;
  readonly addedCard: Locator;
  readonly scanResult: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.main = page.getByRole('main');
    this.addedCard = page.getByRole('region', { name: 'Added' });
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

  async submitDetails() {
    await this.main.getByRole('button', { name: 'Add funko' }).click();
  }

  async choosePhotos(paths: string[]) {
    await this.page.getByLabel('Photo files').setInputFiles(paths);
  }

  async uploadPhotos(count: number) {
    await this.page.getByRole('button', { name: `Upload ${count} photos` }).click();
  }

  async openAddedFunko(name: string) {
    await this.addedCard.getByRole('link', { name: `Open ${name}` }).click();
  }

  toastWithText(text: string) {
    return this.page.getByRole('region', { name: 'Notifications' }).getByText(text);
  }

  async typeBarcode(code: string) {
    await this.page.getByLabel('Or type the code').fill(code);
    await this.page.getByRole('button', { name: 'Use code' }).click();
  }
}
