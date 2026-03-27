import type { IncomingMessage, ServerResponse } from 'node:http';
import { getJourney } from '../server/repository/journeyRepository';
import { json, methodNotAllowed, requireAuth } from './_lib/http.js';

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'GET') {
    methodNotAllowed(response, ['GET']);
    return;
  }

  const context = await requireAuth(request, response);

  if (!context) {
    return;
  }

  try {
    const result = await getJourney(context.user.id);
    json(response, 200, result);
  } catch (error) {
    json(response, 500, {
      error: error instanceof Error ? error.message : 'Failed to load journey data.',
    });
  }
}
