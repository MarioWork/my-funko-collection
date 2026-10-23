import { render, screen, userEvent } from '@test-utils';
import { SidebarProvider } from '@components/ui/sidebar';
import SidebarEdgeToggle from './SidebarEdgeToggle';

const renderToggle = () =>
  render(
    <SidebarProvider>
      <SidebarEdgeToggle />
    </SidebarProvider>,
  );

it('collapses the sidebar, and then offers to expand it, when the edge is pressed', async () => {
  renderToggle();

  const collapse = screen.getByRole('button', { name: 'Collapse sidebar' });

  expect(collapse).toHaveAttribute('aria-expanded', 'true');

  await userEvent.click(collapse);

  expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false');
});

it('can be reached and used with the keyboard alone', async () => {
  renderToggle();

  await userEvent.tab();

  expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveFocus();

  await userEvent.keyboard('{Enter}');

  expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
});
