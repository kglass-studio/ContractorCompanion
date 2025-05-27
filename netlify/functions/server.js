import expressApp from '../../dist/index.js';
import serverless from 'serverless-http';

export const handler = serverless(expressApp);