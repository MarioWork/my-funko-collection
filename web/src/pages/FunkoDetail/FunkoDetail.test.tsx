import { renderRoutes, screen, userEvent, within } from '@test-utils';
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

it('announces why the delete failed, as an alert in the dialog, when the funko is still in a collection', async () => {
  const [funko] = mockStore.funkos;
  renderRoutes(funkoRoutes, { initialEntries: [FUNKO_ROUTES_PATHS.detail(String(funko?.id))] });

  await userEvent.click(await screen.findByRole('button', { name: `Actions for ${funko?.name}` }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  const dialog = await screen.findByRole('alertdialog');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

  expect(await within(dialog).findByRole('alert')).toHaveTextContent(/still in a collection/);
});
