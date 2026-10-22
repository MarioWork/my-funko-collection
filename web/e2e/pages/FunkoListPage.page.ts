import type { Locator, Page } from '@playwright/test';
import { FUNKO_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

export class FunkoListPage {
  readonly tiles: Locator;
  readonly emptyState: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.tiles = page.getByRole('list', { name: 'Funkos' }).getByRole('link');
    this.emptyState = page.getByRole('heading', { name: 'Nothing matches' });
  }

  async goto() {
    await this.page.goto(FUNKO_ROUTES_PATHS.BASE);
  }

  async search(text: string) {
    await this.page.getByRole('searchbox', { name: 'Search funkos' }).fill(text);
  }

  async openFunko(name: string) {
    await this.tiles.filter({ hasText: name }).first().click();
  }
}
