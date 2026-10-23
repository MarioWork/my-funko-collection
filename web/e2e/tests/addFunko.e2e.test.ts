import path from 'node:path';
import { expect, test } from '../fixtures/app.fixture';
import { AddPage } from '../pages/AddPage.page';
import { FunkoDetailPage } from '../pages/FunkoDetailPage.page';

const PHOTOS = ['front.png', 'back.png'].map((file) => path.join(import.meta.dirname, '../fixtures/photos', file));
const SEED_SPIDER_MAN_BARCODE = '889698624008';

test('adds a funko by hand with two photos into two collections in one save', async ({ page }) => {
  const add = new AddPage(page);
  const detail = new FunkoDetailPage(page);

  await add.gotoManual();
  await add.fillDetails({ name: 'Test Pop', number: '999', categoryName: 'Pop! Games' });
  await add.choosePhotos(PHOTOS);

  await expect(add.photosToUpload()).toHaveCount(PHOTOS.length);
  await expect(add.pickedCollections()).toHaveText(['Owned']);

  await add.pickCollection('Wishlist');
  await add.save();

  await expect(add.savedCard).toContainText('Test Pop');
  await expect(add.savedCard).toContainText('Saved to Owned, Wishlist.');
  await expect(add.savedCard.getByRole('img', { name: 'Test Pop' })).toBeVisible();

  await add.openSavedFunko('Test Pop');

  await expect(detail.title).toHaveText('Test Pop');
  await expect(page.getByText('#999', { exact: true })).toBeVisible();
});

test('"Add another" opens an empty form that keeps the collections picked last time', async ({ page }) => {
  const add = new AddPage(page);

  await add.gotoManual();
  await add.fillDetails({ name: 'First Pop', number: '1', categoryName: 'Pop! Games' });
  await add.choosePhotos(PHOTOS.slice(0, 1));
  await add.dropLastCollection();
  await add.pickCollection('Wishlist');
  await add.save();

  await expect(add.savedCard).toContainText('Saved to Wishlist.');

  await add.addAnother();

  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('');
  await expect(add.pickedCollections()).toHaveText(['Wishlist']);
});

test('a typed barcode of a funko already in the catalog offers +1 instead of a duplicate', async ({ page }) => {
  const add = new AddPage(page);

  await add.goto();
  await add.typeBarcode(SEED_SPIDER_MAN_BARCODE);

  await expect(add.scanResult).toContainText('Spider-Man');
  await expect(add.scanResult.getByRole('button', { name: '+1 in Owned' })).toBeVisible();
});
