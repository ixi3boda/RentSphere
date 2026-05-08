// src/tests/mocks/server.js
//
// MSW Node-environment server. Imported by setupTests.js to start/reset/close
// the mock service worker for every test file.

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
