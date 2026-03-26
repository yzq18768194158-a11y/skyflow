<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SkyFlow Full-Stack App

This project is now a small full-stack app:

- `src/` contains the React + Vite frontend
- `server/` contains the Express API
- `shared/` contains the shared data contract between frontend and backend
- `supabase/schema.sql` contains the database schema for Supabase

## Tech stack

- Frontend: React 19 + Vite + Tailwind CSS
- Backend: Express + TypeScript
- Database: Supabase Postgres via the REST API

## Run locally

1. Install dependencies:
   `npm install`
2. Create a local env file from the example:
   `cp .env.example .env`
3. Fill in these Supabase variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SERVER_URL` (local development can stay `http://localhost:3001`)
4. In Supabase SQL Editor, run:
   `supabase/schema.sql`
5. Start frontend and backend together:
   `npm run dev`

The frontend runs on `http://localhost:3000` and proxies API requests to the Express server on `http://localhost:3001`.

## API routes

- `GET /api/health`
- `GET /api/journey`
- `POST /api/journey/select-flight`

## Notes

- Supabase Auth is required for the app now. The frontend uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to sign users in.
- The backend uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to verify access tokens and read or write per-user journey data.
- When a signed-in user loads the app for the first time, the backend auto-seeds that user's `journeys` row with the default record.
