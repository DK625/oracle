# Oracle Architecture Overview

## System summary

Oracle is a TypeScript CLI that assembles prompts and files, runs model consultations through API or browser engines, and persists durable sessions and artifacts.

## Main components

- `src/oracle/`: API model routing and execution.
- `src/browser/`: ChatGPT browser automation, response extraction, file discovery, and local artifact persistence.
- `src/remote/`: token-protected browser bridge server/client protocol.
- `src/cli/`: CLI configuration, bridge diagnostics, session display, and commands.
- `src/sessionManager.ts`: durable session and artifact metadata.

## Data flow

For bridge browser runs, the Linux client sends a run to the Windows host. The host admits runs through a bounded active+FIFO queue layer, controls authenticated Chrome, saves current-response artifacts, emits redacted descriptors, and serves artifact bytes through a token-protected endpoint. The Linux client streams to a partial file, validates it, atomically renames it, and stores client-local metadata.

## External dependencies

- ChatGPT Web and Chrome DevTools Protocol for browser mode.
- Node.js >=24 and pnpm for source builds.
- SSH reverse tunnel for the Windows-host/cloud-Linux bridge deployment.

## Runtime environments

Linux, macOS, and Windows. The active bridge deployment uses a Windows browser host and cloud Linux client.

## Known risks

- Mixed bridge versions can return text but cannot guarantee client-local artifacts.
- Bridge run admission must stay bounded so a single host cannot accumulate unbounded HTTP streams or staged attachments.
- Download links and host paths may contain sensitive data and must remain redacted.
- Interrupted transfers must never publish partial files as completed artifacts.
- Browser DOM/download behavior can change independently of the CLI release.
