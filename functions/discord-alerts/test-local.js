import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './index.js';

// Load .env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mockRes = {
  json: (data) => console.log('RESPONSE:', JSON.stringify(data, null, 2)),
  send: (data) => console.log('SEND:', data),
};

const mockContext = {
  req: {},
  res: mockRes,
  log: (msg) => console.log('[LOG]:', msg),
  error: (msg) => console.error('[ERROR]:', msg),
};

console.log('--- STARTING LOCAL TEST ---');
console.log('Using Bot Token:', process.env.DISCORD_BOT_TOKEN ? 'FOUND' : 'MISSING');

handler(mockContext)
  .then(() => console.log('--- TEST FINISHED ---'))
  .catch((err) => console.error('--- CRITICAL TEST ERROR ---', err));
