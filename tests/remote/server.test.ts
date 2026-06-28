import { describe, expect, test } from "vitest";
import http from "node:http";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { mkdtemp, rm, writeFile, readFile, stat } from "node:fs/promises";
import { createRemoteServer } from "../../src/remote/server.js";
import { createRemoteBrowserExecutor } from "../../src/remote/client.js";
import type { BrowserRunResult } from "../../src/browserMode.js";
import type { RemoteRunEvent } from "../../src/remote/types.js";
import { setOracleHomeDirOverrideForTest } from "../../src/oracleHome.js";

const CAN_LISTEN_LOCALHOST =
  spawnSync(
    process.execPath,
    [
      "-e",
      `
      const net = require('net');
      const s = net.createServer();
      s.on('error', () => process.exit(1));
      s.listen(0, '127.0.0.1', () => s.close(() => process.exit(0)));
    `,
    ],
    { stdio: "ignore" },
  ).status === 0;

describe("remote browser service", () => {
  test.skipIf(!CAN_LISTEN_LOCALHOST)(
    "streams logs and returns results via client executor",
    async () => {
      const tmpDir = await mkdtemp(path.join(os.tmpdir(), "oracle-remote-test-"));
      const attachmentPath = path.join(tmpDir, "note.txt");
      const fallbackAttachmentPath = path.join(tmpDir, "fallback.txt");
      await writeFile(attachmentPath, "hello world", "utf8");
      await writeFile(fallbackAttachmentPath, "fallback world", "utf8");

      const runLog: string[] = [];
      const server = await createRemoteServer(
        { host: "127.0.0.1", port: 0, token: "secret", logger: () => {} },
        {
          runBrowser: async (options) => {
            runLog.push(options.prompt);
            expect(options.sessionId).toBe("remote-session-id");
            expect(options.followUpPrompts).toEqual(["follow up"]);
            expect(options.attachments).toHaveLength(1);
            const attachment = options.attachments?.[0];
            if (!attachment) {
              throw new Error("missing attachment");
            }
            const stored = await readFile(attachment.path, "utf8");
            expect(stored).toBe("hello world");
            expect(options.fallbackSubmission?.prompt).toBe("fallback prompt");
            expect(options.fallbackSubmission?.attachments).toHaveLength(1);
            const fallbackAttachment = options.fallbackSubmission?.attachments[0];
            if (!fallbackAttachment) {
              throw new Error("missing fallback attachment");
            }
            const fallbackStored = await readFile(fallbackAttachment.path, "utf8");
            expect(fallbackStored).toBe("fallback world");
            options.log?.("uploading attachment");
            const result: BrowserRunResult = {
              answerText: "hi",
              answerMarkdown: "hi",
              tookMs: 1000,
              answerTokens: 42,
              answerChars: 2,
            };
            return result;
          },
        },
      );

      const executor = createRemoteBrowserExecutor({
        host: `127.0.0.1:${server.port}`,
        token: "secret",
      });
      const clientLogs: string[] = [];
      const result = await executor({
        prompt: "remote",
        attachments: [{ path: attachmentPath, displayPath: "note.txt", sizeBytes: 11 }],
        fallbackSubmission: {
          prompt: "fallback prompt",
          attachments: [
            { path: fallbackAttachmentPath, displayPath: "fallback.txt", sizeBytes: 14 },
          ],
        },
        config: {},
        sessionId: "remote-session-id",
        followUpPrompts: ["follow up"],
        log: (message?: string) => {
          if (message) clientLogs.push(message);
        },
      });

      expect(clientLogs.some((entry) => entry.includes("uploading attachment"))).toBe(true);
      expect(result.answerText).toBe("hi");
      expect(runLog).toEqual(["remote"]);

      const healthUnauthorized = await httpGetJson({
        hostname: "127.0.0.1",
        port: server.port,
        path: "/health",
      });
      expect(healthUnauthorized.statusCode).toBe(401);

      const healthOk = await httpGetJson({
        hostname: "127.0.0.1",
        port: server.port,
        path: "/health",
        token: "secret",
      });
      expect(healthOk.statusCode).toBe(200);
      expect(healthOk.json?.ok).toBe(true);
      expect(typeof healthOk.json?.version).toBe("string");
      expect(healthOk.json?.capabilities).toMatchObject({
        artifactTransfer: true,
        artifactProtocolVersion: 1,
      });

      await server.close();
      await rm(tmpDir, { recursive: true, force: true });
    },
  );

  test.skipIf(!CAN_LISTEN_LOCALHOST)(
    "transfers saved browser file artifacts to the client session directory",
    async () => {
      const tmpDir = await mkdtemp(path.join(os.tmpdir(), "oracle-remote-artifact-test-"));
      const clientHome = path.join(tmpDir, "client-home");
      setOracleHomeDirOverrideForTest(clientHome);
      const hostArtifactPath = path.join(tmpDir, "host-result.zip");
      const emptyZip = Buffer.from([
        0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);
      await writeFile(hostArtifactPath, emptyZip);

      const server = await createRemoteServer(
        { host: "127.0.0.1", port: 0, token: "secret", logger: () => {} },
        {
          runBrowser: async () => {
            const result: BrowserRunResult = {
              answerText: "done",
              answerMarkdown: "done",
              tookMs: 1000,
              answerTokens: 1,
              answerChars: 4,
              savedFiles: [
                {
                  kind: "file",
                  path: hostArtifactPath,
                  label: "result.zip",
                  mimeType: "application/zip",
                  sizeBytes: emptyZip.length,
                  sourceUrl: "sandbox:/mnt/data/result.zip",
                  url: "browser-download",
                  finalUrl: "browser-download",
                  filename: "result.zip",
                },
              ],
              artifacts: [
                {
                  kind: "file",
                  path: hostArtifactPath,
                  label: "result.zip",
                  mimeType: "application/zip",
                  sizeBytes: emptyZip.length,
                  sourceUrl: "sandbox:/mnt/data/result.zip",
                },
              ],
            };
            return result;
          },
        },
      );

      const executor = createRemoteBrowserExecutor({
        host: `127.0.0.1:${server.port}`,
        token: "secret",
      });
      const result = await executor({
        prompt: "remote",
        config: {},
        sessionId: "remote-artifact-session",
      });

      expect(result.answerText).toBe("done");
      expect(result.artifacts).toHaveLength(1);
      const artifact = result.artifacts?.[0];
      expect(artifact?.path).toBe(
        path.join(clientHome, "sessions", "remote-artifact-session", "artifacts", "result.zip"),
      );
      expect(artifact?.path).not.toBe(hostArtifactPath);
      expect(artifact).toMatchObject({
        kind: "file",
        label: "result.zip",
        mimeType: "application/zip",
        sizeBytes: emptyZip.length,
        sourceUrl: "bridge-artifact",
        validation: { type: "zip", ok: true },
        transfer: { status: "completed", bytes: emptyZip.length },
        origin: { mode: "bridge" },
      });
      expect(artifact?.sha256).toMatch(/^[a-f0-9]{64}$/);
      await expect(readFile(artifact!.path)).resolves.toEqual(emptyZip);
      await expect(stat(hostArtifactPath)).resolves.toMatchObject({ size: emptyZip.length });

      await server.close();
      await rm(tmpDir, { recursive: true, force: true });
      setOracleHomeDirOverrideForTest(null);
    },
  );

  test.skipIf(!CAN_LISTEN_LOCALHOST)(
    "admits three concurrent runs and queues the fourth by default",
    async () => {
      const completions = new Map<string, Deferred<BrowserRunResult>>();
      const started: string[] = [];
      const server = await createRemoteServer(
        { host: "127.0.0.1", port: 0, token: "secret", logger: () => {} },
        {
          runBrowser: async (options) => {
            started.push(options.prompt);
            const completion = createDeferred<BrowserRunResult>();
            completions.set(options.prompt, completion);
            return await completion.promise;
          },
        },
      );
      const executor = createRemoteBrowserExecutor({
        host: `127.0.0.1:${server.port}`,
        token: "secret",
      });

      const runs = [1, 2, 3].map((index) =>
        executor({ prompt: `run-${index}`, config: {}, sessionId: `run-${index}` }),
      );
      await waitFor(() => started.length === 3);
      expect(started).toEqual(["run-1", "run-2", "run-3"]);

      const fourth = executor({ prompt: "run-4", config: {}, sessionId: "run-4" });
      await delay(50);
      expect(started).toEqual(["run-1", "run-2", "run-3"]);

      completions.get("run-1")?.resolve(makeResult("done-1"));
      await waitFor(() => started.includes("run-4"));
      completions.get("run-2")?.resolve(makeResult("done-2"));
      completions.get("run-3")?.resolve(makeResult("done-3"));
      completions.get("run-4")?.resolve(makeResult("done-4"));

      await expect(Promise.all([...runs, fourth])).resolves.toHaveLength(4);
      expect(started).toEqual(["run-1", "run-2", "run-3", "run-4"]);

      const healthOk = await httpGetJson({
        hostname: "127.0.0.1",
        port: server.port,
        path: "/health",
        token: "secret",
      });
      expect(healthOk.json?.runAdmission).toMatchObject({
        maxActiveRuns: 3,
        maxQueuedRuns: 3,
        activeRuns: 0,
        queuedRuns: 0,
      });

      await server.close();
    },
  );

  test.skipIf(!CAN_LISTEN_LOCALHOST)(
    "returns backward-compatible busy when the bounded queue is full",
    async () => {
      const completions = new Map<string, Deferred<BrowserRunResult>>();
      const started: string[] = [];
      const server = await createRemoteServer(
        {
          host: "127.0.0.1",
          port: 0,
          token: "secret",
          logger: () => {},
          maxConcurrentRuns: 1,
          maxQueuedRuns: 1,
        },
        {
          runBrowser: async (options) => {
            started.push(options.prompt);
            const completion = createDeferred<BrowserRunResult>();
            completions.set(options.prompt, completion);
            return await completion.promise;
          },
        },
      );
      const executor = createRemoteBrowserExecutor({
        host: `127.0.0.1:${server.port}`,
        token: "secret",
      });

      const first = executor({ prompt: "run-1", config: {}, sessionId: "run-1" });
      await waitFor(() => started.includes("run-1"));
      const second = executor({ prompt: "run-2", config: {}, sessionId: "run-2" });
      await delay(50);
      expect(started).toEqual(["run-1"]);
      await expect(executor({ prompt: "run-3", config: {}, sessionId: "run-3" })).rejects.toThrow(
        "busy",
      );

      completions.get("run-1")?.resolve(makeResult("done-1"));
      await waitFor(() => started.includes("run-2"));
      completions.get("run-2")?.resolve(makeResult("done-2"));
      await expect(Promise.all([first, second])).resolves.toHaveLength(2);
      expect(started).toEqual(["run-1", "run-2"]);

      await server.close();
    },
  );

  test.skipIf(!CAN_LISTEN_LOCALHOST)(
    "removes disconnected queued runs and admits later requests",
    async () => {
      const completions = new Map<string, Deferred<BrowserRunResult>>();
      const started: string[] = [];
      const server = await createRemoteServer(
        {
          host: "127.0.0.1",
          port: 0,
          token: "secret",
          logger: () => {},
          maxConcurrentRuns: 1,
          maxQueuedRuns: 1,
        },
        {
          runBrowser: async (options) => {
            started.push(options.prompt);
            const completion = createDeferred<BrowserRunResult>();
            completions.set(options.prompt, completion);
            return await completion.promise;
          },
        },
      );
      const executor = createRemoteBrowserExecutor({
        host: `127.0.0.1:${server.port}`,
        token: "secret",
      });

      const first = executor({ prompt: "run-1", config: {}, sessionId: "run-1" });
      await waitFor(() => started.includes("run-1"));

      const queued = postRunRaw({ port: server.port, token: "secret", prompt: "queued" });
      await queued.responseStarted;
      queued.req.destroy(new Error("test disconnect"));
      await queued.done.catch(() => undefined);
      await waitFor(async () => {
        const health = await httpGetJson({
          hostname: "127.0.0.1",
          port: server.port,
          path: "/health",
          token: "secret",
        });
        return (health.json?.runAdmission as { queuedRuns?: number } | undefined)?.queuedRuns === 0;
      });

      const later = executor({ prompt: "run-later", config: {}, sessionId: "run-later" });
      await delay(50);
      expect(started).toEqual(["run-1"]);
      completions.get("run-1")?.resolve(makeResult("done-1"));
      await waitFor(() => started.includes("run-later"));
      completions.get("run-later")?.resolve(makeResult("done-later"));
      await expect(Promise.all([first, later])).resolves.toHaveLength(2);

      await server.close();
    },
  );

  test.skipIf(!CAN_LISTEN_LOCALHOST)(
    "releases a running slot after client disconnect and run cleanup completes",
    async () => {
      const completions = new Map<string, Deferred<BrowserRunResult>>();
      const started: string[] = [];
      const server = await createRemoteServer(
        {
          host: "127.0.0.1",
          port: 0,
          token: "secret",
          logger: () => {},
          maxConcurrentRuns: 1,
          maxQueuedRuns: 0,
        },
        {
          runBrowser: async (options) => {
            started.push(options.prompt);
            const completion = createDeferred<BrowserRunResult>();
            completions.set(options.prompt, completion);
            return await completion.promise;
          },
        },
      );

      const running = postRunRaw({ port: server.port, token: "secret", prompt: "run-1" });
      void running.done.catch(() => undefined);
      await waitFor(() => started.includes("run-1"));
      running.req.destroy(new Error("test disconnect"));
      completions.get("run-1")?.resolve(makeResult("done-1"));

      const executor = createRemoteBrowserExecutor({
        host: `127.0.0.1:${server.port}`,
        token: "secret",
      });
      await waitFor(async () => {
        const health = await httpGetJson({
          hostname: "127.0.0.1",
          port: server.port,
          path: "/health",
          token: "secret",
        });
        return (health.json?.runAdmission as { activeRuns?: number } | undefined)?.activeRuns === 0;
      });
      const next = executor({ prompt: "run-2", config: {}, sessionId: "run-2" });
      await waitFor(() => started.includes("run-2"));
      completions.get("run-2")?.resolve(makeResult("done-2"));
      await expect(next).resolves.toMatchObject({ answerText: "done-2" });

      await server.close();
    },
  );

  test.skipIf(!CAN_LISTEN_LOCALHOST)(
    "artifact endpoints bypass run admission and remain isolated by run id",
    async () => {
      const tmpDir = await mkdtemp(path.join(os.tmpdir(), "oracle-remote-artifact-bypass-test-"));
      const hostArtifactPath = path.join(tmpDir, "host-result.zip");
      const emptyZip = Buffer.from([
        0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);
      await writeFile(hostArtifactPath, emptyZip);
      const completions = new Map<string, Deferred<BrowserRunResult>>();
      const server = await createRemoteServer(
        {
          host: "127.0.0.1",
          port: 0,
          token: "secret",
          logger: () => {},
          maxConcurrentRuns: 1,
          maxQueuedRuns: 0,
        },
        {
          runBrowser: async (options) => {
            if (options.prompt === "artifact") {
              return {
                ...makeResult("done"),
                savedFiles: [
                  {
                    kind: "file",
                    path: hostArtifactPath,
                    label: "result.zip",
                    mimeType: "application/zip",
                    sizeBytes: emptyZip.length,
                    sourceUrl: "sandbox:/mnt/data/result.zip",
                    url: "browser-download",
                    finalUrl: "browser-download",
                    filename: "result.zip",
                  },
                ],
              };
            }
            const completion = createDeferred<BrowserRunResult>();
            completions.set(options.prompt, completion);
            return await completion.promise;
          },
        },
      );

      const artifactRun = postRunRaw({ port: server.port, token: "secret", prompt: "artifact" });
      const artifactResult = await artifactRun.done;
      expect(artifactResult.statusCode).toBe(200);
      const artifactEvent = artifactResult.events.find((event) => event.type === "artifact-ready");
      expect(artifactEvent?.type).toBe("artifact-ready");
      if (artifactEvent?.type !== "artifact-ready") {
        throw new Error("missing artifact-ready event");
      }

      const blocking = postRunRaw({ port: server.port, token: "secret", prompt: "blocking" });
      void blocking.done.catch(() => undefined);
      await waitFor(() => completions.has("blocking"));
      const correct = await httpGetRaw({
        hostname: "127.0.0.1",
        port: server.port,
        path: `/runs/${artifactEvent.runId}/artifacts/${artifactEvent.artifact.artifactId}`,
        token: "secret",
      });
      expect(correct.statusCode).toBe(200);
      expect(correct.body).toEqual(emptyZip);
      const wrongRun = await httpGetRaw({
        hostname: "127.0.0.1",
        port: server.port,
        path: `/runs/not-${artifactEvent.runId}/artifacts/${artifactEvent.artifact.artifactId}`,
        token: "secret",
      });
      expect(wrongRun.statusCode).toBe(404);
      const wrongArtifact = await httpGetRaw({
        hostname: "127.0.0.1",
        port: server.port,
        path: `/runs/${artifactEvent.runId}/artifacts/not-${artifactEvent.artifact.artifactId}`,
        token: "secret",
      });
      expect(wrongArtifact.statusCode).toBe(404);
      const unauthorized = await httpGetRaw({
        hostname: "127.0.0.1",
        port: server.port,
        path: `/runs/${artifactEvent.runId}/artifacts/${artifactEvent.artifact.artifactId}`,
      });
      expect(unauthorized.statusCode).toBe(401);

      blocking.req.destroy(new Error("test cleanup"));
      completions.get("blocking")?.resolve(makeResult("done-blocking"));
      await server.close();
      await rm(tmpDir, { recursive: true, force: true });
    },
  );
});

async function httpGetJson({
  hostname,
  port,
  path,
  token,
}: {
  hostname: string;
  port: number;
  path: string;
  token?: string;
}): Promise<{ statusCode: number; json: Record<string, unknown> | null }> {
  return await new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname,
        port,
        path,
        method: "GET",
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      },
      (res) => {
        res.setEncoding("utf8");
        let body = "";
        res.on("data", (chunk: string) => {
          body += chunk;
        });
        res.on("end", () => {
          const statusCode = res.statusCode ?? 0;
          let json: Record<string, unknown> | null = null;
          try {
            const parsed = body.length ? JSON.parse(body) : null;
            json =
              parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
          } catch {
            json = null;
          }
          resolve({ statusCode, json });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeResult(answerText: string): BrowserRunResult {
  return {
    answerText,
    answerMarkdown: answerText,
    tookMs: 1,
    answerTokens: 1,
    answerChars: answerText.length,
  };
}

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs = 1500,
): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      if (await predicate()) {
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await delay(10);
  }
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error(`Timed out after ${timeoutMs}ms waiting for condition.`);
}

function postRunRaw({ port, token, prompt }: { port: number; token: string; prompt: string }): {
  req: http.ClientRequest;
  responseStarted: Promise<number>;
  done: Promise<{ statusCode: number; body: string; events: RemoteRunEvent[] }>;
} {
  const body = Buffer.from(
    JSON.stringify({
      prompt,
      attachments: [],
      browserConfig: {},
      options: { sessionId: prompt },
    }),
  );
  let startResponse!: (statusCode: number) => void;
  const responseStarted = new Promise<number>((resolve) => {
    startResponse = resolve;
  });
  let req!: http.ClientRequest;
  const done = new Promise<{ statusCode: number; body: string; events: RemoteRunEvent[] }>(
    (resolve, reject) => {
      req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/runs",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": body.length,
            authorization: `Bearer ${token}`,
          },
        },
        (res) => {
          const statusCode = res.statusCode ?? 0;
          startResponse(statusCode);
          res.setEncoding("utf8");
          let raw = "";
          let buffer = "";
          const events: RemoteRunEvent[] = [];
          res.on("data", (chunk: string) => {
            raw += chunk;
            buffer += chunk;
            let newlineIndex = buffer.indexOf("\n");
            while (newlineIndex !== -1) {
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);
              if (line.length > 0) {
                events.push(JSON.parse(line) as RemoteRunEvent);
              }
              newlineIndex = buffer.indexOf("\n");
            }
          });
          res.on("end", () => resolve({ statusCode, body: raw, events }));
          res.on("error", reject);
        },
      );
      req.on("error", reject);
      req.write(body);
      req.end();
    },
  );
  return { req, responseStarted, done };
}

async function httpGetRaw({
  hostname,
  port,
  path,
  token,
}: {
  hostname: string;
  port: number;
  path: string;
  token?: string;
}): Promise<{ statusCode: number; body: Buffer }> {
  return await new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname,
        port,
        path,
        method: "GET",
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer | string) => {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        });
        res.on("end", () =>
          resolve({ statusCode: res.statusCode ?? 0, body: Buffer.concat(chunks) }),
        );
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.end();
  });
}
