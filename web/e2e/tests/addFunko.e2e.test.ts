import path from 'node:path';
import { expect, test } from '../fixtures/app.fixture';
import { AddPage } from '../pages/AddPage.page';
import { FunkoDetailPage } from '../pages/FunkoDetailPage.page';

const PHOTOS = ['front.png', 'back.png'].map((file) => path.join(import.meta.dirname, '../fixtures/photos', file));
const SEED_SPIDER_MAN_BARCODE = '889698624008';

test('adds a funko by hand with two photos', async ({ page }) => {
  const add = new AddPage(page);
  const detail = new FunkoDetailPage(page);

  await add.gotoManual();
  await add.fillDetails({ name: 'Test Pop', number: '999', categoryName: 'Pop! Games' });
  await add.submitDetails();

  await expect(add.addedCard).toContainText('Test Pop');
  await expect(add.addedCard).toContainText('Added to Owned.');

  await add.choosePhotos(PHOTOS);
  await add.uploadPhotos(PHOTOS.length);

  await expect(add.toastWithText('2 photo(s) added')).toBeVisible();

  await add.openAddedFunko('Test Pop');

  await expect(detail.title).toHaveText('Test Pop');
  await expect(page.getByText('#999', { exact: true })).toBeVisible();
});

test('a typed barcode of a funko already in the catalog offers +1 instead of a duplicate', async ({ page }) => {
  const add = new AddPage(page);

  await add.goto();
  await add.typeBarcode(SEED_SPIDER_MAN_BARCODE);

  await expect(add.scanResult).toContainText('Spider-Man');
  await expect(add.scanResult.getByRole('button', { name: /^\+1 in Owned|^Add to Owned/ })).toBeVisible();
});
