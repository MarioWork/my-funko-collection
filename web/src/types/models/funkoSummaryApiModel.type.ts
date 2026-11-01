import type { FunkoTypeUtil } from '@app-types/utility';
import type { NamedApiModel } from './namedApiModel.type';
import type { PrimaryImageApiModel } from './primaryImageApiModel.type';

// The funko shape embedded in items and suggestions.
export interface FunkoSummaryApiModel {
  id: number;
  name: string;
  number: string;
  type: FunkoTypeUtil;
  isChase: boolean;
  exclusive: string;
  barcode: string | null;
  category: NamedApiModel;
  // The series it belongs to; every funko has one.
  series: NamedApiModel;
  primaryImage: PrimaryImageApiModel | null;
}
