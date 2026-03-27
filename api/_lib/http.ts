import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifySupabaseAccessToken } from '../../server/auth';

export interface ApiContext {
  user: {
    id: string;
    email?: string;
  };
}

export function json(response: ServerResponse, statusCode: number, body: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export function methodNotAllowed(response: ServerResponse, allowed: string[]) {
  response.setHeader('Allow', allowed.join(', '));
  json(response, 405, { error: `Method not allowed. Use: ${allowed.join(', ')}` });
}

export async function requireAuth(request: IncomingMessage, response: ServerResponse): Promise<ApiContext | null> {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    json(response, 401, { error: 'Authorization token is required.' });
    return null;
  }

  try {
    const user = await verifySupabaseAccessToken(header.slice('Bearer '.length));
    return { user };
  } catch (error) {
    json(response, 401, {
      error: error instanceof Error ? error.message : 'Authentication failed.',
    });
    return null;
  }
}

export async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');

  if (!rawBody) {
    return {} as T;
  }

  return JSON.parse(rawBody) as T;
}
