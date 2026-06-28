# ADR-0002: Pull bridge artifacts over the existing authenticated service

## Status

Accepted

## Context

In the Windows-host/cloud-Linux deployment, Chrome downloads exist on Windows while the caller needs a Linux-readable artifact path. Existing NDJSON results intentionally removed host-local artifact paths.

## Decision

Keep downloading on the authenticated Windows host. Register each completed artifact under the run, emit a redacted descriptor, and let the Linux client pull bytes from a token-protected endpoint. Validate on both sides and publish only after an atomic client rename.

## Why

- Reuses the existing bearer token and SSH tunnel.
- Keeps browser credentials and signed URLs on Windows.
- Avoids base64 and memory overhead in the NDJSON stream.
- Supports bounded TTL, retryable fetches, and backward-compatible capability negotiation.

## Alternatives considered

- SCP from host to cloud: rejected as the default because identity/path management is deployment-specific.
- Base64 chunks in NDJSON: rejected because of overhead and poor retry behavior.
- Download directly on Linux: rejected because authenticated browser state belongs to Windows.
- Manual download/upload only: retained as fallback, not the primary path.

## Consequences

- Both endpoints must run the patched version for automatic transfer.
- The host keeps a bounded in-memory registry of artifact descriptors until TTL expiry.
- Session metadata can safely expose a Linux-local path and verification state.

## Rollback plan

Run the released npm package on both endpoints. Mixed versions continue returning text and show manual artifact-copy guidance.

## Related files

- `src/remote/server.ts`
- `src/remote/client.ts`
- `src/remote/types.ts`
- `src/browser/artifacts.ts`
- `docs/bridge.md`

## Date

2026-06-28
