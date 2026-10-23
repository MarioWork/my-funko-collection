import axios from 'axios';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import routes from './application/routes';
import ThemeProvider from './application/theme/ThemeProvider';
import { ignoreDroppedViewTransitions } from './common/utils/viewTransitionUtils';
import './index.css';

const env = import.meta.env;
const projectPath = env.VITE_PROJECT_PATH || '/';

async function setUpApp() {
  axios.defaults.baseURL = env.VITE_BASE_API_URL;
  ignoreDroppedViewTransitions();

  const isUsingMocks = env.VITE_USE_MOCKS === 'true';
  // Under Playwright the test brings its own mock network, and two mock layers would race on one request.
  const isPlaywright = env.VITE_PLAYWRIGHT === 'true';

  if (isUsingMocks && !isPlaywright) {
    const { startMockNetwork } = await import('./mocks/browser.ts');

    await startMockNetwork(env.VITE_BASE_API_URL);
  }
}

// Kept here: outside this file, HMR rebuilds it on every update and the app refetches everything.
const getRouter = () => createBrowserRouter(routes, { basename: projectPath });

const root = ReactDOM.createRoot(document.getElementById('root')!);

await setUpApp();

root.render(
  <ThemeProvider>
    <RouterProvider router={getRouter()} />
  </ThemeProvider>,
);
