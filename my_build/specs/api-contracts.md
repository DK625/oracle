# API Contracts

## `GET /health`

Requires the existing bridge bearer token.

Relevant response fields:

```json
{
  "ok": true,
  "capabilities": {
    "artifactTransfer": true,
    "artifactProtocolVersion": 1,
    "maxArtifactBytes": 536870912
  }
}
```

Clients must treat missing capabilities as an old host and use manual artifact fallback without failing text runs.

## `POST /runs`

Requires bearer authentication and returns NDJSON. Artifact descriptors are redacted: no host filesystem path, cookie, bridge credential, or signed ChatGPT URL.

## `GET /runs/<runId>/artifacts/<artifactId>`

Requires the same bearer token. Returns registered artifact bytes with:

- `Content-Length`
- `Content-Disposition`
- `X-Oracle-Artifact-Id`
- `X-Oracle-Artifact-Sha256`

Errors include unauthorized, not found, expired/unavailable, and too large. The client treats these as artifact failures while retaining the text response.

## Compatibility

- Patched client + old host: no artifact events; text result remains valid.
- Old client + patched host: unknown artifact events are ignored; text result remains valid.
- Automatic transfer is supported only when both sides implement protocol v1.
