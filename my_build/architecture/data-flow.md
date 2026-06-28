# Data Flow

## Bridge artifact write path

1. Linux client submits `POST /runs` through the SSH reverse tunnel.
2. Windows host runs authenticated ChatGPT browser automation.
3. Browser downloader saves a current-turn file into the Windows session artifact directory.
4. Host validates metadata and emits `artifact-ready` without host path or signed URL.
5. Linux client pulls `GET /runs/<runId>/artifacts/<artifactId>` with the bridge token.
6. Client writes a collision-safe `.part-*` file, checks size/SHA-256/ZIP structure, then atomically renames it.
7. Session metadata publishes the Linux-local path with `validation=ok` and `transfer=completed`.

## Capability read path

- `/health` advertises `artifactTransfer`, protocol version, and maximum bytes.
- `oracle bridge doctor` renders `Artifact transfer: bridge v1` when both connection and host capability are available.

## Async/event paths

- `/runs` is NDJSON with `log`, `artifact-ready`, optional `artifact-progress`, `result`, and `error` events.
- Artifact bytes use a separate pull request to avoid base64 overhead in NDJSON.

## Failure paths
- Old host: text response completes; doctor and CLI show manual fallback.
- Transfer/validation failure: delete partial file, preserve text response, store a warning.
- Missing/expired artifact: endpoint returns an HTTP error and client falls back to manual copy.
