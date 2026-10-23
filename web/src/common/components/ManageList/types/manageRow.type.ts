import type { ExportFunkosScopeUtil } from '@app-types/utility';

export type ManageRow = {
  id: number;
  name: string;
  notes: string | null;
  // "12 funkos", "3 items": what the row is attached to.
  meta: string;
  isDeletable: boolean;
  // What its Export menu downloads the funkos of (the row's id within it); `exportDisabledReason` says why there
  // is nothing to export yet.
  exportScope: ExportFunkosScopeUtil;
  exportDisabledReason?: string;
  deleteDescription: string;
};
