import { createColumnHelper, tableFeatures } from '@tanstack/react-table';
import type { CollectionItemApiModel } from '@app-types/models';

// Core features only: no sorting or filtering on the client, the API already did both for this page.
export const itemTableFeatures = tableFeatures({});

export const itemColumnHelper = createColumnHelper<typeof itemTableFeatures, CollectionItemApiModel>();
