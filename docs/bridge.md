# Bridge (Windows-hosted ChatGPT session → Linux clients)

Oracle’s bridge workflow lets you keep an authenticated ChatGPT session on a Windows machine while running Oracle (CLI + `oracle-mcp`) from Linux boxes (often over SSH), without exporting browser cookies off Windows.

## Concepts

- **Host (Windows)**: runs `oracle bridge host` and holds the signed-in ChatGPT session.
- **Client (Linux)**: stores the host connection once and routes browser runs (and MCP browser runs) through the host.

## Generated artifact transfer

Bridge runs now keep the Windows browser host and Linux client separated while still returning ChatGPT-generated files, such as ZIP, CSV, PDF, wheels, and source distributions, to a cloud-readable path. The host advertises artifact-transfer support from the token-protected `GET /health` response. The Linux client uses that capability signal in `oracle bridge client --test` and `oracle bridge doctor`; older hosts remain usable for text responses, but generated files require manual copy from the Windows browser until both sides are upgraded.

The transfer protocol is pull-based and keeps secrets local to the host:

1. The browser host saves the ChatGPT file to its local session artifacts directory as before.
2. The host emits only a redacted artifact descriptor over the existing NDJSON run stream: artifact id, safe filename, MIME type, byte size, SHA-256, validation status, and coarse source kind. It does not expose cookies, bearer tokens, signed ChatGPT download URLs, or Windows filesystem paths.
3. The Linux client fetches `GET /runs/<runId>/artifacts/<artifactId>` with the same bridge bearer token, writes to `~/.oracle/sessions/<sessionId>/artifacts/`, verifies size and SHA-256, validates ZIP structure when applicable, and only then publishes the final path in session metadata.
4. If transfer fails, Oracle keeps the text response and records a warning with manual fallback instructions. Open the ChatGPT browser on the Windows host, use the visible download button/link in the current assistant response, and copy the file to a cloud-readable path yourself.

Operational notes:

- Run the same patched Oracle version on both Windows host and Linux client before relying on automatic file transfer. Mixed versions remain backward compatible for text-only runs.
- `oracle bridge doctor` reports `Artifact transfer: bridge v1` when the host supports the protocol, including the advertised maximum artifact size.
- The default bridge transfer size limit is 512 MiB. Larger files stay on the browser host and require manual copy.
- Session inspection prints artifact path, size, SHA-256 prefix, validation status, and transfer status so agents can verify whether the returned path is local to the Linux client.

## Bridge run concurrency

Bridge hosts now use bounded run admission instead of the old single-flight `busy` guard. By default, one `oracle bridge host` / `oracle serve` process admits up to **3 active remote browser runs** and keeps up to **3 additional runs** in a FIFO queue. This mirrors the local Windows browser mode default: the bridge protects HTTP/stream resources, while the browser layer’s tab lease registry remains the lower-level authority for the shared ChatGPT profile and tab count.

Contract for `POST /runs`:

- Requests within the active limit start immediately and stream NDJSON as before.
- Requests beyond the active limit wait in the bounded FIFO queue and receive a normal `200 application/x-ndjson` stream with a log line indicating the queued position.
- Requests beyond active + queued capacity receive the backward-compatible `409 {"error":"busy"}` response with extra non-secret queue metadata. Existing clients still see this as a busy host.
- Disconnecting a queued client removes that request from the queue. Disconnecting a running client closes its response stream; the host still releases the bridge slot and removes per-run temp attachment directories when browser cleanup completes.
- `GET /runs/<runId>/artifacts/<artifactId>` bypasses run-slot admission and remains protected by the same bearer token. Artifact descriptors and transfer responses never expose Windows host paths, cookies, signed ChatGPT URLs, or bridge tokens.

Tuning knobs:

```powershell
oracle bridge host --max-concurrent-runs 3 --max-queued-runs 3
oracle serve --max-concurrent-runs 3 --max-queued-runs 3
```

Equivalent environment variables are `ORACLE_REMOTE_MAX_ACTIVE_RUNS` and `ORACLE_REMOTE_MAX_QUEUED_RUNS`. Set `--max-queued-runs 0` when you prefer the old immediate `409 busy` behavior once all active slots are occupied.

`oracle bridge doctor` and the token-protected `/health` response report the configured active/queued limits and current active/queued counts when the host supports this contract. Older clients ignore these additional fields.

## 1) Windows: start the host service (recommended)

Run this on the Windows machine that’s signed into ChatGPT:

```powershell
oracle bridge host --token auto --ssh user@your-linux-host
```

What it does:

- Starts a local `oracle serve` instance bound to `127.0.0.1:9473` by default.
- Generates an access token (stored to disk; not printed unless you ask).
- Starts an SSH reverse tunnel so the Linux host can reach the Windows service at `127.0.0.1:9473`.
- Writes a connection artifact to `~/.oracle/bridge-connection.json` (contains host + token).

Useful flags:

- Bind a different local port: `--bind 127.0.0.1:9474`
- Use a specific token: `--token <value>`
- Print the connection string (includes token): `--print`
- Print only the token: `--print-token`
- SSH port/custom args: `--ssh-extra-args "-p 2222"`
- Background mode (writes pid/log files under `~/.oracle`): `--background`

## 2) Linux: configure the client once

Copy the connection artifact from Windows to Linux (example from Windows → Linux):

```powershell
scp "$env:USERPROFILE\.oracle\bridge-connection.json" user@your-linux-host:~/bridge-connection.json
```

Then on the Linux host:

```bash
oracle bridge client --connect ~/bridge-connection.json --write-config --test
```

This writes:

- `~/.oracle/config.json` → `browser.remoteHost` and `browser.remoteToken`

Now browser runs automatically route through the host:

```bash
oracle --engine browser -p "hello" --file README.md
```

## 2b) Linux desktop: local manual-login (no bridge)

If you’re physically on a Linux desktop and just want Oracle to reuse a local signed-in Chrome profile (no Windows bridge):

1. Run a browser session once and sign in when Chrome opens:

```bash
ORACLE_HOME_DIR=~/.oracle-local \
ORACLE_BROWSER_PROFILE_DIR=~/.oracle-local/browser-profile \
oracle --engine browser --browser-manual-login --browser-keep-browser -p "hello"
```

2. After you’re signed in, reuse the same env vars for future runs (no more login prompts).

Optional: use the helper wrapper `scripts/oracle-local-browser.sh` to avoid repeating flags/env vars:

```bash
chmod +x ./scripts/oracle-local-browser.sh
./scripts/oracle-local-browser.sh -p "hello" --file README.md
```

## 3) Codex CLI (MCP) integration

On the Linux machine where Codex runs:

```bash
oracle bridge codex-config
```

Paste the printed snippet into `~/.codex/config.toml`.

## 3b) Claude Code (MCP) integration

On the Linux machine where Claude Code runs:

```bash
oracle bridge claude-config > .mcp.json
```

Then start Claude Code with that config (or register it via `claude mcp add` depending on your setup).

Notes:

- The snippet includes `ORACLE_ENGINE="browser"` so MCP consult calls use browser mode even if `OPENAI_API_KEY` is set.
- By default the snippets leave `ORACLE_REMOTE_TOKEN` as `<YOUR_TOKEN>` to avoid printing secrets; rerun with `--print-token` if you explicitly want it included.

### macOS local browser: Let Them Fight

If Claude Code and the signed-in Chrome profile are on the same Mac, skip the remote bridge and generate a local config:

```bash
oracle bridge claude-config --local-browser > .mcp.json
```

This points Claude Code at `oracle-mcp`, sets `ORACLE_ENGINE="browser"`, and reuses the shared manual-login profile at `~/.oracle/browser-profile`. From Claude Code, call `consult` with `preset:"chatgpt-pro-heavy"` for the “Let Them Fight” workflow: Claude asks Oracle, Oracle asks ChatGPT Pro Extended in browser mode, and the answer comes back through MCP. Use `dryRun:true` first when you only want to validate the resolved request.

For long Pro runs, keep the Oracle session id visible in the agent transcript and inspect `oracle status` / `oracle session <id>` before retrying. Browser consults may wait on ChatGPT for several minutes; the dry-run/browser control plan is the operator-facing signal for whether Oracle will attach to an existing browser, use remote Chrome, or launch a visible window.

Override local paths when needed:

```bash
oracle bridge claude-config \
  --local-browser \
  --oracle-home-dir ~/.oracle \
  --browser-profile-dir ~/.oracle/browser-profile > .mcp.json
```

## 4) Troubleshooting

Run:

```bash
oracle bridge doctor
```

It checks:

- Whether a remote host/token is configured
- TCP reachability to the remote host
- Remote auth via `GET /health` (token-protected)
- If no remote is configured, it probes local Chrome + cookie DB detection and suggests `--browser-chrome-path` / `--browser-cookie-path`

## Security notes

- Tokens are not printed by default.
- The connection artifact and config file contain secrets; keep them private (Oracle writes them with restrictive permissions on Unix).
- Bridge does **not** extract/decrypt cookies from arbitrary profiles; the Windows machine keeps the authenticated session locally.
