/// <reference types="vite/client" />
/// <reference types="msw/vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROJECT_PATH: string;
  readonly VITE_PLAYWRIGHT: string;
  readonly VITE_BASE_API_URL: string;
  readonly VITE_USE_MOCKS: string;
  // Mock mode only: this many generated funkos on top of the seed, to try long lists (`yarn dev:big`).
  readonly VITE_MOCK_EXTRA_FUNKOS?: string;
  // Mock mode only: open signed out (`signedOut`) or before the first run (`setup`) instead of signed in.
  readonly VITE_MOCK_AUTH_STATE?: string;
  // Mock mode only: who is signed in (`member`, `read-only`, `read-only-admin`, `new-user`, `last-admin`) instead of
  // the default admin (`yarn dev:member` and the other start commands, src/mocks/mockPersonas.ts).
  readonly VITE_MOCK_PERSONA?: string;
  // The public demo build (GitHub Pages): shows the "changes are not saved" banner.
  readonly VITE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected by Vite's `define` from package.json.
declare const __APP_VERSION__: string;
