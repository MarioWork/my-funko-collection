import { getAllCollections, getAllTags } from '@api/optionLists';
import authService from '@services/authService/authService';

export async function loader() {
  const [collections, tags, passkeys] = await Promise.all([
    getAllCollections(),
    getAllTags(),
    authService.getPasskeys(),
  ]);

  return { collections, tags, passkeys: passkeys.data };
}
