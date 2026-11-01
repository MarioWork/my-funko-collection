// The one password every seeded dev user signs in with, on the mocks and on a local API seeded with `yarn db:seed`
// (api/prisma/seed.ts, keep them in step). Its own file, with no imports, so scripts/checkProductionBundle.ts can read
// it in plain Node and fail any build that contains it.
export const DEV_SIGN_IN_PASSWORD = 'funko-dev-password-123';
