// The one check both funkos.service.ts and images/funkoImages.service.ts need, so neither imports the other's
// repository through the back door.
import { NotFoundError } from '../../lib/httpErrors.ts';
import { funkosRepository } from './funkos.repository.ts';

const ENTITY = 'Funko';

export async function assertFunkoExists(id: number): Promise<void> {
  const row = await funkosRepository.findById(id);

  if (!row) throw new NotFoundError(ENTITY, id);
}
