# NEXUS production configuration

## Request flow

The browser calls the same-origin Next.js route at `/api/proxy/*`.
The proxy creates a signed, HTTP-only session cookie and forwards requests to
the API with `x-user-id` and `x-api-key`. Secrets are never exposed through
`NEXT_PUBLIC_*` variables.

## Required backend variables

Copy `apps/api/.env.example` and set at least:

- `MONGO_URI`
- `GEMINI_API_KEY`
- `NEXUS_API_KEY`
- `CORS_ORIGINS`

In production, the API refuses to start without `NEXUS_API_KEY` and
`CORS_ORIGINS`.

## Required web variables

Copy `apps/web/.env.example` and set:

- `NEXUS_API_URL`: private URL of the API service
- `NEXUS_API_KEY`: same value used by the API
- `NEXUS_SESSION_SECRET`: a different long random value used to sign sessions

Changing `NEXUS_SESSION_SECRET` invalidates existing browser sessions.

## Health endpoints

- `GET /health`: process liveness
- `GET /health/ready`: readiness, including MongoDB connectivity

## Deployment checks

```powershell
cd apps/api
npm.cmd run typecheck
npm.cmd test
npm.cmd run build

cd ../web
npm.cmd run lint
npm.cmd run build
```

The built-in rate limiter is process-local. Replace it with a shared store
such as Redis before running multiple API replicas.
