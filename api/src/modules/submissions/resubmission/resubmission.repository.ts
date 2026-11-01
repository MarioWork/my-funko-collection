import { prisma } from '../../../lib/prisma.ts';

export const resubmissionRepository = {
  // Only a rejected funko is sent again (false otherwise): it waits once more, without the reason, and as the sender
  // sent it now.
  resend: async (id: number): Promise<boolean> => {
    const write = await prisma.funko.updateMany({
      where: { id, status: 'REJECTED' },
      data: { status: 'WAITING', rejectionReason: null, changedByAdminAt: null },
    });

    return write.count > 0;
  },
};
