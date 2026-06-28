# Hướng dẫn migration bridge artifact transfer cho case3

Bối cảnh môi trường hiện tại: Windows browser/bridge host và cloud Linux client đều đang cài bằng `npm install -g @steipete/oracle@latest`. Bản patch này cần chạy cùng source trên cả hai đầu cho đến khi upstream merge/release; sau release có thể quay lại npm global.

## Mục tiêu triển khai

- Windows host tiếp tục giữ Chrome/ChatGPT session và file tải xuống cục bộ.
- Cloud Linux client nhận file ChatGPT-generated vào `~/.oracle/sessions/<sessionId>/artifacts/` qua bridge endpoint token-protected.
- Không truyền cookie, token ChatGPT, signed download URL, hoặc đường dẫn Windows qua NDJSON result.
- Nếu hai đầu lệch version, text response vẫn chạy; file artifact có hướng dẫn manual fallback.

## Workflow fork/branch upstream-ready

Các lệnh này là mẫu để bạn tự tạo fork/branch/PR. Gói ZIP này không tự tạo GitHub fork hoặc pull request.

```bash
# Máy làm việc có GitHub CLI đã đăng nhập
# Thay <your-github-user> bằng GitHub user/org của bạn.
git clone https://github.com/<your-github-user>/oracle.git
cd oracle
git remote add upstream https://github.com/steipete/oracle.git
git fetch upstream
git checkout -b bridge-artifact-transfer upstream/main

# Copy toàn bộ file đã patch từ thư mục oracle/ trong ZIP này vào working tree.
# Sau đó kiểm tra diff, commit và push.
git status --short
git diff -- src tests docs CHANGELOG.md BRIDGE_ARTIFACT_TRANSFER_MIGRATION_VI.md CHANGED_FILES_MANIFEST.md
git add src tests docs CHANGELOG.md BRIDGE_ARTIFACT_TRANSFER_MIGRATION_VI.md CHANGED_FILES_MANIFEST.md
git commit -m "Add bridge artifact transfer protocol"
git push -u origin bridge-artifact-transfer

gh pr create \
  --repo steipete/oracle \
  --base main \
  --head <your-github-user>:bridge-artifact-transfer \
  --title "Add secure bridge artifact transfer" \
  --body "Adds capability-negotiated bridge transfer for ChatGPT-generated files with SHA-256, ZIP validation, safe filenames, and manual fallback for mixed-version deployments."
```

## Build/test validation cần chạy trước rollout

Oracle snapshot yêu cầu Node >= 24 và `pnpm@10.33.2`.

```bash
node --version   # cần >= v24
corepack enable
corepack prepare pnpm@10.33.2 --activate
pnpm install
pnpm run format:check
pnpm run typecheck
pnpm test -- tests/browser/artifacts.test.ts tests/browser/chatgptFiles.test.ts tests/remote/server.test.ts
pnpm run build
```

Nếu muốn tự sửa format trước khi test:

```bash
pnpm run format
pnpm run lint
pnpm run build
```

## Chạy patched Oracle từ source trên Windows bridge host

PowerShell:

```powershell
# 1) Lấy branch đã patch
cd C:\src
git clone https://github.com/<your-github-user>/oracle.git oracle-bridge-artifact-transfer
cd C:\src\oracle-bridge-artifact-transfer
git checkout bridge-artifact-transfer

# 2) Build
corepack enable
corepack prepare pnpm@10.33.2 --activate
pnpm install
pnpm run build

# 3) Tạm thay npm global bằng source link
npm uninstall -g @steipete/oracle
npm link
oracle --version

# 4) Khởi động bridge host với fixed token của case3; không dùng --token auto
oracle bridge host --bind 127.0.0.1:9473 --token <existing-fixed-bridge-token> --ssh openclaw --ssh-remote-port 9473 --ssh-extra-args "-o ExitOnForwardFailure=yes" --foreground --print
```

Tùy chọn dùng package `.tgz` thay vì link source:

```powershell
cd C:\src\oracle-bridge-artifact-transfer
pnpm run build
pnpm pack --pack-destination C:\tmp
npm uninstall -g @steipete/oracle
npm install -g C:\tmp\steipete-oracle-0.15.0.tgz
oracle --version
oracle bridge host --bind 127.0.0.1:9473 --token <existing-fixed-bridge-token> --ssh openclaw --ssh-remote-port 9473 --ssh-extra-args "-o ExitOnForwardFailure=yes" --foreground --print
```

## Chạy patched Oracle từ source trên cloud Linux client

```bash
# 1) Lấy cùng branch đã patch
git clone https://github.com/<your-github-user>/oracle.git ~/src/oracle-bridge-artifact-transfer
cd ~/src/oracle-bridge-artifact-transfer
git checkout bridge-artifact-transfer

# 2) Build
corepack enable
corepack prepare pnpm@10.33.2 --activate
pnpm install
pnpm run build

# 3) Tạm thay npm global bằng source link
npm uninstall -g @steipete/oracle || true
npm link
oracle --version

# 4) Ghi lại bridge config và kiểm tra capability artifact transfer.
# bridge client mặc định vừa ghi config vừa gọi /health; CLI không có --write-config/--test.
oracle bridge client --connect 'oracle+tcp://127.0.0.1:9473?token=<existing-fixed-bridge-token>'
oracle bridge doctor

# 5) Smoke test tạo file ZIP qua ChatGPT Web
oracle --engine browser -p "Create a small ZIP file with one README.txt and provide it as a downloadable file."
oracle status --limit 1
# Kiểm tra session artifact path nằm dưới ~/.oracle/sessions/<sessionId>/artifacts/ trên Linux.
```

Tùy chọn dùng package `.tgz` trên Linux:

```bash
cd ~/src/oracle-bridge-artifact-transfer
pnpm run build
pnpm pack --pack-destination /tmp
npm uninstall -g @steipete/oracle || true
npm install -g /tmp/steipete-oracle-0.15.0.tgz
oracle --version
```

## Rollout an toàn

1. Dừng bridge host cũ trên Windows.
2. Cài/link source patched trên Windows host và Linux client.
3. Start lại `oracle bridge host ...` trên Windows.
4. Chạy `oracle bridge client --connect 'oracle+tcp://127.0.0.1:9473?token=<existing-fixed-bridge-token>'` trên Linux; lệnh mặc định ghi config và test `/health`.
5. Chạy `oracle bridge doctor`; cần thấy `Artifact transfer: bridge v1`.
6. Chạy smoke test ZIP; kiểm tra metadata session có `transfer=completed`, `validation=ok`, `sha256=...` và path Linux-local.

## Rollback về npm global release

Windows PowerShell:

```powershell
# Nếu đang dùng npm link
npm unlink -g @steipete/oracle
# Nếu unlink không nhận package scoped, dùng uninstall fallback
npm uninstall -g @steipete/oracle
npm install -g @steipete/oracle@latest
oracle --version
oracle bridge host --bind 127.0.0.1:9473 --token <existing-fixed-bridge-token> --ssh openclaw --ssh-remote-port 9473 --ssh-extra-args "-o ExitOnForwardFailure=yes" --foreground --print
```

Cloud Linux:

```bash
npm unlink -g @steipete/oracle || true
npm uninstall -g @steipete/oracle || true
npm install -g @steipete/oracle@latest
oracle --version
oracle bridge client --connect 'oracle+tcp://127.0.0.1:9473?token=<existing-fixed-bridge-token>'
oracle bridge doctor
```

## Lưu ý mixed-version

- Patched client + old host: text response vẫn chạy, nhưng `/health` không advertise artifact transfer; `oracle bridge doctor` sẽ cảnh báo manual fallback.
- Old client + patched host: old client có thể bỏ qua event artifact-ready; text response vẫn chạy, host/client cần được nâng cấp để tự động nhận Linux-local file path.
- Chỉ coi transfer hoàn tất khi session metadata hiển thị artifact path trên Linux với `transfer=completed`, `validation=ok`, size và SHA-256.
