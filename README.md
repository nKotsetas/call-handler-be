# call-handler-be

Backend for the call handler app. Calls and notes are stored in memory and seeded from
`src/data/`. There is also an Express API with the same endpoints as the course API, so the
frontend can use this one instead.

## Setup

Needs Node 22.9 or newer.

```bash
npm install
npm start        # runs src/index.js and prints the results of the service functions
npm run server   # starts the api on http://localhost:3000
npm test
npm run lint
```

## Structure

```
src/
  data/           seed data (calls.json, notes.json)
  models/         call and note shape
  repositories/   in-memory database and read/write functions
  services/       business logic
  validation/     checks for calls, notes and filters
  http/           express app, routes, middleware
  index.js        script that tries out the service
  server.js       starts the api
tests/
```

## Service functions

In `src/services/callService.js`:

- `getAllCalls(filters)` returns the calls that are not archived, newest first. You can filter
  with `call_type`, `direction` and `is_archived` (`true`, `false` or `'all'`)
- `getCallById(id)` returns the call with its notes, or `null`
- `archiveCall(id)` / `unarchiveCall(id)` return the updated call, or `null`
- `addNote(callId, content)` returns the new note, or `null` if the call doesn't exist
- `createCall(data)` validates the call and saves it
- `deleteCall(id)` deletes the call and its notes, returns `true` or `false`

Invalid data throws a `ValidationError` with the list of errors.

## API

Every `/calls` request needs an `X-User-Id` header. Each user gets their own copy of the data.

| Method | Path                       |                                          |
| ------ | -------------------------- | ---------------------------------------- |
| GET    | `/calls`                   | active calls, returns `{ calls: [...] }` |
| GET    | `/calls/:callId`           | one call with its notes                  |
| PATCH  | `/calls/:callId/archive`   | archive a call                           |
| PATCH  | `/calls/:callId/unarchive` | unarchive a call                         |
| POST   | `/calls/:callId/notes`     | add a note, body `{ "content": "..." }`  |
| POST   | `/calls`                   | create a call                            |
| DELETE | `/calls/:callId`           | delete a call                            |

`GET /calls` also takes `?call_type=`, `?direction=` and `?is_archived=true|false|all`.

Errors look like `{ "error": "Call not found" }`. Validation errors return 400 and include
`details`.

```bash
curl -H "X-User-Id: nikos" http://localhost:3000/calls
curl -X PATCH -H "X-User-Id: nikos" http://localhost:3000/calls/1/archive
```

`PORT` and `CORS_ORIGIN` can be set in a `.env` file (see `.env.example`).

To use it from the frontend, set `VITE_API_BASE_URL=http://localhost:3000` in the frontend
`.env`. The data resets when the server restarts.
