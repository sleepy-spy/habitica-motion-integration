# HANDOFF: Implement `src/motion.js`

## Goal

Mirror Habitica to-dos into Motion. Every 30 minutes, a GitHub Actions cron job runs `src/index.js`, which fetches incomplete to-dos from Habitica and creates/updates/completes them in Motion.

## Current Status

Everything works **except** `src/motion.js` — it's been reset to a minimal stub. You need to implement 5 functions.

## What Works

- `src/habitica.js` — Fetches incomplete to-dos from Habitica API (tested, working)
- `src/index.js` — Sync orchestrator (fetch → create/update/complete via sync-map.json)
- `.github/workflows/sync.yml` — GitHub Actions cron job, runs every 30 min
- `test/habitica.test.js`, `test/index.test.js` — Tests pass
- `sync-map.json` — Local tracking of Habitica ID → Motion ID + completed flag

## What's Broken

`src/motion.js` is a stub. The 5 functions it exports must match what `src/index.js` imports:

```js
const { getWorkspaceIdByName, getResolvedStatus, listTasks, createTask, updateTask } = require('./motion');
```

## Previous Error

Before the stub, we had this error in GitHub Actions:

```
TypeError: Cannot read properties of undefined (reading 'find')
    at getResolvedStatus (src/motion.js:44:45)
```

The workspace list API (`GET /v1/workspaces`) did NOT include `statuses` on workspace objects. We tried `GET /v1/statuses?workspaceId=xxx` but the API docs suggest the response is a bare array, not `{ statuses: [...] }` — so `json.statuses` was `undefined`.

## Motion API Reference

Base URL: `https://api.usemotion.com/v1`
Auth header: `X-API-Key: <your key>`

### Endpoints you need

**1. List workspaces** — `GET /v1/workspaces`
- Response: `{ workspaces: [{ id: "ws_...", name: "My Tasks (Private)", ... }] }`
- Note: workspace objects may NOT include `statuses` inline

**2. Get statuses for workspace** — `GET /v1/statuses?workspaceId=ws_...`
- Docs say response is a bare array: `[{ name: "Done", isDefaultStatus: false, isResolvedStatus: true }, ...]`
- **This is uncertain** — the previous code tried `json.statuses` and got `undefined`. Try the bare array format first, add logging if it fails.

**3. Create task** — `POST /v1/tasks`
- Body: `{ name, workspaceId, priority: "MEDIUM", duration: 60, description?, dueDate? }`
- Note: `completed` IS accepted on create (POST), just not on update (PATCH)

**4. Update task** — `PATCH /v1/tasks/{id}`
- Body fields: `name`, `description`, `dueDate`, `status` (string name like "Done"), `priority`, `workspaceId`, `labels`, `assigneeId`
- **DO NOT send `completed`** — Motion rejects it with 400: `{"message":["property completed should not exist"]}`
- To complete a task, set `status` to the resolved status name (e.g. `"Done"`)

**5. List tasks** — `GET /v1/tasks?workspaceId=ws_...`
- Response: `{ tasks: [...] }`

### Key Gotchas

1. Motion PATCH rejects `completed` field — use `status` string instead
2. The resolved status name (e.g. `"Done"`) varies by workspace — fetch it from the statuses endpoint
3. Statuses endpoint response format is uncertain — add `console.log` of the raw response to debug
4. The sync runs in GitHub Actions with env vars `HABITICA_USER_ID`, `HABITICA_API_KEY`, `MOTION_API_KEY`
5. Locally, keys go in `.env` (gitignored)

## Files to Edit

1. **`src/motion.js`** — Implement the 5 functions (currently a stub)
2. **`test/motion.test.js`** — Update mocks and tests for the new implementation
3. **`test/index.test.js`** — Add mock for the statuses endpoint (currently mocks `/statuses` but may need format fix)

## How `index.js` Uses These Functions

```
1. getWorkspaceIdByName("My Tasks (Private)") → workspaceId
2. getResolvedStatus(workspaceId) → resolvedStatus (string like "Done")
3. For each Habitica to-do:
   - If in sync-map: updateTask(motionId, { name, description, dueDate, workspaceId })
   - If new: createTask({ name, description, dueDate, workspaceId })
     → save { motionId: created.id, completed: false } to sync-map
4. For each sync-map entry NOT in Habitica:
   - updateTask(motionId, { status: resolvedStatus })
   - Set completed: true in sync-map
```

## Rules (from AGENTS.md)

- Always use conventional commits
- Always check with user before doing anything
- Default to plan mode
- Node.js project (user is beginner in JS)
- Run `npm test` after changes

## Testing

Run tests with:
```bash
npm test
```

This runs all three test files sequentially. Tests use mocked fetch — no real API calls.

## Quick Start

1. Implement `getWorkspaceIdByName` and `getResolvedStatus` first (these are where failures happened)
2. Add a `console.log` of the raw statuses API response to debug the format
3. Then implement `listTasks`, `createTask`, `updateTask`
4. Update tests
5. Run `npm test`
6. Commit and push
