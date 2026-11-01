import type { Locator, Page } from '@playwright/test';
import { BASE_ROUTES_PATHS } from '../../src/application/routes/routesUtils';

// The bell (top of the sidebar on desktop, in the header on phones; only one is on screen) and the notifications
// page it opens.
export class NotificationsPage {
  readonly heading: Locator;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Notifications' });
  }

  async gotoHome() {
    await this.page.goto(BASE_ROUTES_PATHS.HOME);
  }

  // The bell link, named "Notifications" or "Notifications, 2 unread".
  bell(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name, exact: typeof name === 'string' });
  }

  async openFromBell() {
    await this.bell(/^Notifications/).click();
  }

  async open(title: string) {
    await this.page.getByRole('list', { name: 'Your notifications' }).getByRole('link', { name: title }).click();
  }

  async markAllRead() {
    await this.page.getByRole('button', { name: 'Mark all read' }).click();
  }
}
