  Bạn đang thao tác trên Windows repo:

  D:\pp\oracle

  Mục tiêu: cập nhật Windows Oracle bridge host lên commit mới đã push lên DK625/oracle main: 2007d371 "Fix ChatGPT sandbox artifact capture", build lại,
  verify global oracle command dùng source local, rồi restart bridge host.

  Làm các bước sau trong PowerShell:

  1. Vào repo:
  cd D:\pp\oracle

  2. Kiểm tra trạng thái trước khi đổi:
  git status --short --branch
  git remote -v

  Nếu có local changes chưa rõ nguồn gốc, dừng và báo lại. Nếu sạch, tiếp tục.

  3. Pull bản mới:
  git fetch origin
  git pull --ff-only origin main
  git log -1 --oneline

  Kỳ vọng HEAD là 2007d371 hoặc commit mới hơn có chứa fix "Fix ChatGPT sandbox artifact capture".

  4. Cài deps/build:
  corepack enable
  pnpm install --frozen-lockfile
  pnpm run build

  5. Chạy targeted validation:
  pnpm vitest run tests/browser/chatgptFiles.test.ts tests/browser/artifacts.test.ts tests/remote/server.test.ts

  6. Kiểm tra global oracle đang trỏ vào repo này:
  where oracle
  npm list -g --depth=0 @steipete/oracle

  Nếu global oracle chưa link tới D:\pp\oracle, chạy từ D:\pp\oracle:
  npm link

  Sau đó kiểm tra lại:
  where oracle
  oracle --version

  7. Restart Windows bridge host:
  - Đóng terminal bridge host cũ nếu đang chạy.
  - Mở PowerShell mới ở D:\pp\oracle.
  - Chạy:

  oracle bridge host --bind 127.0.0.1:9473 --token f667af3845a136e7a1d6573a1d0ecff2 --ssh openclaw --ssh-remote-port 9473 --ssh-extra-args "-o
  ExitOnForwardFailure=yes" --foreground --print

  Giữ PowerShell này mở.

  8. Báo lại:
  - git log -1 --oneline
  - kết quả pnpm run build
  - kết quả targeted vitest
  - where oracle
  - dòng bridge host báo đã listen/connected

  Sau khi Windows host restart xong, phía Linux chỉ cần chạy lại oracle bridge doctor, rồi live smoke tạo ZIP nhỏ để xác nhận artifact-ready,
  validation=ok, transfer=completed.