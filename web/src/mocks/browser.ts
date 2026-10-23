import { getHandlers } from './handlers';
import { interceptMockDownloads } from './mockDownloads';

// `virtual:msw` comes from the msw/vite plugin (vite.config.ts): it serves the worker script under the app's
// base path and hands back a preconfigured network, so there is no copied mockServiceWorker.js to keep in sync.
export async function startMockNetwork(baseApiUrl: string) {
  const { network } = await import('virtual:msw');

  network.configure({ handlers: getHandlers(baseApiUrl) });

  await network.enable();
  interceptMockDownloads(baseApiUrl);
}
