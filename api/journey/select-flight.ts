import type { IncomingMessage, ServerResponse } from 'node:http';
import { selectRecommendedFlight } from '../../server/repository/journeyRepository';
import { json, methodNotAllowed, readJsonBody, requireAuth } from '../_lib/http';

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'POST') {
    methodNotAllowed(response, ['POST']);
    return;
  }

  const context = await requireAuth(request, response);

  if (!context) {
    return;
  }

  try {
    const body = await readJsonBody<{ code?: string }>(request);
    const code = String(body.code ?? '').trim();

    if (!code) {
      json(response, 400, { error: 'A flight code is required.' });
      return;
    }

    const result = await selectRecommendedFlight(context.user.id, code);
    json(response, 200, result);
  } catch (error) {
    json(response, 400, {
      error: error instanceof Error ? error.message : 'Failed to update selected flight.',
    });
  }
}
