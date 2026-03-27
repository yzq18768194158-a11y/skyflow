import type { IncomingMessage, ServerResponse } from 'node:http';
import { json, methodNotAllowed } from './_lib/http';

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'GET') {
    methodNotAllowed(response, ['GET']);
    return;
  }

  json(response, 200, { ok: true });
}
