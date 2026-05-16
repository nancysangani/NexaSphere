# Contributing to NexaSphere

Thanks for helping keep the project clean and deployable.

## Setup

1. Install Node.js 20+.
2. From the repository root, run `npm install`.
3. Start the app with `npm run dev`.

## Before You Open a PR

1. Run `npm run build`.
2. Run `npm run test`.
3. If you touched user flows, run the relevant Playwright spec from `e2e/`.
4. Keep changes focused and avoid committing generated or unused deployment files.

## Deployment Notes

The public frontend is deployed on Vercel at:

https://nexasphere-glbajaj.vercel.app/

If you add a new production origin, update the backend CORS allowlist and any docs that mention live URLs.

## Branching

1. Create a feature branch from `main`.
2. Use a short, descriptive branch name.
3. Keep pull requests small enough to review quickly.

## Code Quality

1. Prefer small, readable functions.
2. Remove dead code and stale config files when they are no longer needed.
3. Update documentation alongside behavior changes.