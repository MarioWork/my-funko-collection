/// <reference types="vite/client" />
/// <reference types="msw/vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROJECT_PATH: string;
  readonly VITE_PLAYWRIGHT: string;
  readonly VITE_BASE_API_URL: string;
  readonly VITE_USE_MOCKS: string;
  // Mock mode only: this many generated funkos on top of the seed, to try long lists (`yarn dev:big`).
  readonly VITE_MOCK_EXTRA_FUNKOS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected by Vite's `define` from package.json.
declare const __APP_VERSION__: string;
