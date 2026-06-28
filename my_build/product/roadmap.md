# Roadmap

## Now
- Monitor upstream PR #277 for review and CI feedback.
- Keep the patched Windows bridge host and Linux client on the same source revision.
- Validate generated ZIP transfer in real browser workflows.

## Next
- Address upstream review feedback and add edge-case tests where requested.
- Move deployments back to `@steipete/oracle@latest` after merge and release.

## Later
- Consider configurable artifact size/TTL limits if operational evidence requires them.
- Consider richer transfer progress reporting without changing the pull protocol.

## Done
- Capability-negotiated bridge artifact transfer implemented and validated.
- Windows-to-Linux live ZIP smoke test passed with SHA-256 and ZIP validation.
- Fork branch and upstream PR created.

## Dropped / not doing
- Automatic extraction or application of returned ZIP files.
- Exporting ChatGPT cookies or signed URLs to the Linux client.
