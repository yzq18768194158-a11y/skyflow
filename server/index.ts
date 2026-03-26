import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSupabaseServerAuthConfig, verifySupabaseAccessToken } from './auth';
import { getJourney, selectRecommendedFlight } from './repository/journeyRepository';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distPath = path.join(projectRoot, 'dist');

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json());

app.use((request, _response, next) => {
  try {
    if (request.path.startsWith('/api/') && request.path !== '/api/health') {
      assertSupabaseServerAuthConfig();
    }
    next();
  } catch (error) {
    next(error);
  }
});

async function requireAuth(
  request: express.Request,
  response: express.Response,
  next: express.NextFunction,
) {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    response.status(401).json({ error: 'Authorization token is required.' });
    return;
  }

  try {
    const user = await verifySupabaseAccessToken(header.slice('Bearer '.length));
    response.locals.user = user;
    next();
  } catch (error) {
    response.status(401).json({
      error: error instanceof Error ? error.message : 'Authentication failed.',
    });
  }
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/journey', requireAuth, async (_request, response) => {
  try {
    const result = await getJourney(response.locals.user.id);
    response.json(result);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load journey data.',
    });
  }
});

app.post('/api/journey/select-flight', requireAuth, async (request, response) => {
  const code = String(request.body?.code ?? '').trim();

  if (!code) {
    response.status(400).json({ error: 'A flight code is required.' });
    return;
  }

  try {
    const result = await selectRecommendedFlight(response.locals.user.id, code);
    response.json(result);
  } catch (error) {
    response.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update selected flight.',
    });
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  response.status(500).json({
    error: error instanceof Error ? error.message : 'Unexpected server error.',
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (_request, response) => {
    response.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`SkyFlow API listening on http://localhost:${port}`);
});
