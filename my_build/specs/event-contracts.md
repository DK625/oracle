# Event Contracts

## Remote run NDJSON

### Queue log

Producer: Windows remote server. Consumer: Linux remote client.

Payload uses the existing `{ "type": "log", "message": string }` event. Newer hosts may emit a sanitized message when a remote run is queued and another when it acquires a bridge slot. Consumers must treat these as informational logs only; no client behavior should depend on exact wording.

### `artifact-ready`

Producer: Windows remote server. Consumer: Linux remote client.

Payload contains run/artifact identifiers, safe filename, optional label/MIME type, byte size, SHA-256, validation metadata, coarse source kind, and `transferStatus: "ready"`.

### `artifact-progress`

Optional progress event with artifact id, phase (`download`, `transfer`, or `validate`), and byte counters. Consumers must tolerate its absence.

### `result`

Sanitized browser result. The remote client waits for all observed artifact transfer promises, merges successful Linux-local files, adds warnings for failures, then resolves the result.

### Error behavior

Artifact failure does not convert a successful text response into a failed run. A warning records manual fallback instructions; partial client files are removed.

## Add here

- Event name.
- Producer.
- Consumer.
- Payload.
- Retry/idempotency notes.
