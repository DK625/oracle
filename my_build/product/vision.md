# Oracle Product Vision

## One-line summary
Package a prompt plus bounded project context and reliably consult advanced AI models through API or authenticated browser sessions.

## Target users
- Developers and AI coding agents that need high-context model review.
- Teams using a local or remote authenticated ChatGPT browser.
- Maintainers debugging model routing, browser automation, sessions, and artifacts.

## Problems solved
- Large source context must be assembled safely and predictably.
- Browser automation must preserve authenticated sessions without exporting credentials.
- Remote bridge clients need useful results and artifacts on the client machine.
- Long-running sessions need durable status, output, and reattach behavior.

## Non-goals
- Do not bypass provider authentication or browser security boundaries.
- Do not transfer arbitrary external URLs as trusted artifacts.
- Do not auto-apply generated archives to a project checkout.

## Success metrics
- Browser and API runs remain backward compatible across documented upgrades.
- Generated artifacts are attributable to the current run and validated before use.
- Static checks, targeted tests, full unit tests, and platform CI pass before release.

## Current priorities
- Land secure bridge artifact transfer upstream in PR #277.
- Keep Windows browser-host and Linux client behavior interoperable.
- Preserve clear manual fallback when capability negotiation fails.
