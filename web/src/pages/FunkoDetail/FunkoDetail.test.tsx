import { renderRoutes, screen, userEvent } from '@test-utils';
import { funkoRoutes } from '@application/routes/featureRoutes/funkoRoutes';
import { FUNKO_ROUTES_PATHS } from '@application/routes/routesUtils';
import { mockStore } from '@mocks/mockStore';

it('exports the funko as a spreadsheet, CSV or JSON from the Export submenu of its actions', async () => {
  const [funko] = mockStore.funkos;
  renderRoutes(funkoRoutes, { initialEntries: [FUNKO_ROUTES_PATHS.detail(String(funko?.id))] });

  await userEvent.click(await screen.findByRole('button', { name: `Actions for ${funko?.name}` }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Export' }));

  const spreadsheet = await screen.findByRole('menuitem', { name: /Spreadsheet/ });

  expect(spreadsheet).toHaveAttribute(
    'href',
    expect.stringMatching(new RegExp(`/export/funkos\\.xlsx\\?funkoId=${funko?.id}$`)),
  );
  expect(spreadsheet).toHaveAttribute('download');
  expect(screen.getByRole('menuitem', { name: /JSON/ })).toHaveAttribute(
    'href',
    expect.stringContaining('funkos.json'),
  );
});
