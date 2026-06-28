# Validation notes

Validation sau khi apply trên cloud Linux ngày 2026-06-28:

```text
Node: v24.15.0
pnpm: v10.33.2
pnpm install --frozen-lockfile: PASS
pnpm run format:check: PASS
pnpm run typecheck: PASS
pnpm run lint: PASS
Targeted tests: PASS — 3 files, 29 tests
Image download regression test: PASS — 1 file, 14 tests
Full unit suite: PASS — 140 files/1340 tests passed; 18 files/43 tests skipped
pnpm run build: PASS
git diff --check: PASS
npm link trên cloud Linux: PASS — oracle resolve tới /opt/one_hammer/oracle/dist/bin/oracle-cli.js
oracle bridge doctor: PASS — host hiện tại chưa advertise capability nên báo manual fallback đúng thiết kế
```

Hai lỗi của artifact gốc đã được sửa trong lúc validation:

- Chạy formatter chuẩn của repo cho 7 file chưa đúng format.
- Sửa lint `no-useless-spread` trong remote client và cập nhật assertion download behavior để bao gồm `eventsEnabled: true`.

Chưa chạy live end-to-end smoke qua Windows bridge host. Cloud Linux đã link patched source, nhưng Windows host vẫn là bản npm global cũ. Bước tiếp theo là cài cùng patched source trên Windows host, restart bridge, xác nhận `oracle bridge doctor` hiển thị `Artifact transfer: bridge v1`, rồi tạo một ZIP nhỏ từ ChatGPT Web và kiểm tra Linux-local artifact path, SHA-256, ZIP validation và `transfer=completed`.
