import { renderRoutes, screen, userEvent } from '@test-utils';
import { imageRoutes } from '@application/routes/featureRoutes/imageRoutes';
import { IMAGE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { ImageViewUtil } from '@app-types/utility';
import { IMAGE_VIEW_STORAGE_KEY } from '@utils/layoutUtils';

const renderPage = () => renderRoutes(imageRoutes, { initialEntries: [IMAGE_ROUTES_PATHS.BASE] });

afterEach(() => {
  window.localStorage.clear();
});

it('opens grouped by funko when no view was saved', async () => {
  renderPage();

  expect(await screen.findByRole('button', { name: 'View: Group by funko' })).toBeVisible();
});

it('opens in the view saved on this device when the URL names none', async () => {
  window.localStorage.setItem(IMAGE_VIEW_STORAGE_KEY, ImageViewUtil.IMAGES);
  renderPage();

  expect(await screen.findByRole('button', { name: 'View: All images' })).toBeVisible();
});

it('saves a view picked on the page as this device’s default', async () => {
  renderPage();

  await userEvent.click(await screen.findByRole('button', { name: 'View: Group by funko' }));
  await userEvent.click(await screen.findByRole('menuitemradio', { name: /All images/ }));

  expect(window.localStorage.getItem(IMAGE_VIEW_STORAGE_KEY)).toBe(ImageViewUtil.IMAGES);
});
