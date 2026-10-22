import { setupServer } from 'msw/node';
import { getHandlers } from './handlers';

export const TEST_BASE_API_URL = 'http://localhost:8080/api';

export const server = setupServer(...getHandlers(TEST_BASE_API_URL));
