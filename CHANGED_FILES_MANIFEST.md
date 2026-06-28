# Changed-files manifest: bridge artifact transfer

## Source

- `src/browser/artifacts.ts`
  - Thêm helper dùng chung cho safe artifact filename, session artifact directory, unique path, SHA-256, generic/ZIP validation.
  - Ghi metadata `sha256`, `validation`, `transfer`, `origin` cho text/binary artifacts.

- `src/browser/chatgptFiles.ts`
  - Bật Chrome download events khi cấu hình download behavior.
  - Ghi metadata kiểm chứng cho file tải bằng browser download button fallback.
  - Không đưa raw ChatGPT signed download URL vào artifact metadata; dùng source marker khử nhạy cảm.

- `src/sessionManager.ts`
  - Mở rộng `SessionArtifact` với validation, transfer, origin, SHA-256 metadata.

- `src/remote/types.ts`
  - Thêm `RemoteArtifactCapabilities`, `RemoteArtifactDescriptor`, event `artifact-ready`, event `artifact-progress`.

- `src/remote/health.ts`
  - Parse capability negotiation từ `/health` để client/doctor nhận biết bridge artifact protocol.

- `src/remote/server.ts`
  - Advertise artifact transfer capability trong `/health`.
  - Đăng ký artifact descriptor sau browser run, emit descriptor khử nhạy cảm qua NDJSON, và phục vụ `GET /runs/<runId>/artifacts/<artifactId>` bằng bearer token hiện có.
  - Validate completion state, size limit, SHA-256/ZIP metadata, TTL registry; không đưa Windows path, cookie, token hoặc signed URL vào result.
  - Giữ `sanitizeResult` cho bridge result và thêm log fallback cho mixed-version clients.

- `src/remote/client.ts`
  - Xử lý `artifact-ready`, kéo binary qua bridge endpoint, ghi `.part-*`, xác minh byte size + SHA-256 + ZIP/generic validation, rồi rename atomic sang Linux session artifacts path.
  - Merge artifacts/savedFiles vào `BrowserRunResult`; khi transfer fail, thêm warning manual fallback nhưng vẫn giữ text response.

- `src/cli/bridge/client.ts`
  - In capability artifact transfer trong `oracle bridge client --test`; cảnh báo manual copy nếu host chưa hỗ trợ.

- `src/cli/bridge/doctor.ts`
  - Báo `Artifact transfer: bridge v1` và max size từ `/health`; cảnh báo fallback nếu host cũ.

- `src/cli/sessionDisplay.ts`
  - Hiển thị artifact size, SHA-256 prefix, validation và transfer status trong session output.

## Tests

- `tests/browser/artifacts.test.ts`
  - Thêm coverage cho metadata binary artifacts và ZIP validation.

- `tests/browser/chatgptImages.test.ts`
  - Cập nhật contract test cho `Browser.setDownloadBehavior` khi bật download events.

- `tests/remote/server.test.ts`
  - Thêm integration-style test cho bridge transfer: host artifact path không leak, client nhận file dưới `ORACLE_HOME_DIR/sessions/<sessionId>/artifacts`, byte content/size/SHA/ZIP validation đúng.

## Docs/release notes

- `CHANGELOG.md`
  - Thêm entry 0.15.1 Unreleased cho bridge artifact transfer.

- `docs/bridge.md`
  - Thêm mô tả protocol artifact transfer, capability negotiation, fallback, size limit, security notes.

- `docs/browser-mode.md`
  - Cập nhật phần ChatGPT-generated downloadable files để phân biệt same-host và bridge transfer.

- `BRIDGE_ARTIFACT_TRANSFER_MIGRATION_VI.md`
  - Hướng dẫn fork/branch/PR, build/test, chạy source trên Windows host và Linux client, rollout/rollback; dùng fixed token và CLI flags đúng với case3.

- `VALIDATION_NOTES.md`
  - Ghi rõ validation đã thử trong sandbox và các lệnh cần chạy trong môi trường Node >=24.

## Validation sau khi apply

Đã chạy trên Node v24.15.0 với pnpm v10.33.2: install frozen lockfile, format check, typecheck/lint, targeted tests, full unit test suite và build. Kết quả chi tiết nằm trong `VALIDATION_NOTES.md`. Live smoke qua Windows bridge host chưa chạy vì cần rollout cùng patched source ở cả hai đầu.

## Patch file

- `../bridge-artifact-transfer.patch` trong ZIP root là unified diff giữa repository snapshot gốc và repository đã cập nhật.
