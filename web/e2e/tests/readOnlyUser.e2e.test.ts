import { UserRoleUtil } from '@app-types/utility';
import { expect, test } from '../fixtures/app.fixture';
import { CollectionsPage } from '../pages/CollectionsPage.page';

test.use({ userRole: UserRoleUtil.MEMBER, isReadOnly: true });

test('a read-only member sees New collection disabled, and tabbing to it says the account is read-only', async ({
  page,
}) => {
  const collections = new CollectionsPage(page);

  await collections.goto();
  await collections.tabToNewCollection();

  await expect(collections.newCollectionButton).toHaveAttribute('aria-disabled', 'true');
  await expect(collections.tooltip).toContainText('Your account is read-only.');
});
