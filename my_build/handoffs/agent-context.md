# Agent Context

## Repository purpose

Oracle packages prompts/files and consults AI models through API and browser engines. The active custom feature transfers ChatGPT-generated artifacts from a Windows browser bridge host to a cloud Linux client.

## Current active areas
- Secure bridge artifact transfer.
- Protocol v1 capability negotiation and authenticated pull endpoint.
- Upstream PR #277 and fork deployment until merge/release.

## Read order
1. `my_build/INDEX.md`
2. `my_build/features/bridge-artifact-transfer.md` for this feature.
3. The routed ADR/spec/debug file needed for the current task.

## Do not read by default
- Raw Oracle sessions under `~/.oracle`.
- Archive and template/example files.
- Unrelated source modules unless the routed implementation map requires them.

## Common tasks
- Monitor/fix PR #277.
- Diagnose `manual fallback` versus `bridge v1`.
- Validate Windows-to-Linux generated-file transfer.
- Update protocol docs/tests when event or endpoint contracts change.

## Update obligations
After durable changes, update the relevant `my_build` file and run `python3 my_build/scripts/run_all_checks.py`.

## Safety rules
Do not commit secrets, raw logs, runtime dumps, or large binaries.
