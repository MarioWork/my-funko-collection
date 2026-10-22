// Mirrors FUNKO_TYPES in api/src/db/schema/funkos.ts.
export const FunkoTypeUtil = {
  POP: 'POP',
  POP_DELUXE: 'POP_DELUXE',
  POP_RIDES: 'POP_RIDES',
  POP_MOMENT: 'POP_MOMENT',
  POP_TOWN: 'POP_TOWN',
  POP_ALBUM: 'POP_ALBUM',
  POP_JUMBO: 'POP_JUMBO',
  POP_KEYCHAIN: 'POP_KEYCHAIN',
  SODA: 'SODA',
  BITTY_POP: 'BITTY_POP',
  MYSTERY_MINI: 'MYSTERY_MINI',
  OTHER: 'OTHER',
} as const;
export type FunkoTypeUtil = (typeof FunkoTypeUtil)[keyof typeof FunkoTypeUtil];

export const FUNKO_TYPE_LABELS: Record<FunkoTypeUtil, string> = {
  POP: 'Pop!',
  POP_DELUXE: 'Pop! Deluxe',
  POP_RIDES: 'Pop! Rides',
  POP_MOMENT: 'Pop! Moment',
  POP_TOWN: 'Pop! Town',
  POP_ALBUM: 'Pop! Album',
  POP_JUMBO: 'Pop! Jumbo',
  POP_KEYCHAIN: 'Pop! Keychain',
  SODA: 'Soda',
  BITTY_POP: 'Bitty Pop!',
  MYSTERY_MINI: 'Mystery Mini',
  OTHER: 'Other',
};
