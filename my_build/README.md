# Oracle my_build

Durable Git-friendly project knowledge for Oracle development and operations.

`my_build` là project memory kernel: nơi lưu knowledge bền vững để người và AI agent tìm đúng context nhanh, debug nhanh, tránh lặp lại lỗi cũ, và tiết kiệm token/context.

> Do not dump raw notes here. Only store durable project knowledge.

## Khi nào dùng

Dùng repo này khi project bắt đầu có nhiều feature, bug, debug note, quyết định kiến trúc, setup local, hoặc handoff cho Claude/Codex.

Không dùng để lưu raw log, file tạm, binary lớn, dump database, hoặc mọi thứ chỉ có giá trị trong vài phút.

## Cách copy vào project

1. Copy toàn bộ folder này vào project thật.
2. Mở `my_build/INDEX.md` trước.
3. Sửa `my_build/manifest.yml` theo project.
4. Điền dần các file trong `my_build/product`, `architecture`, `features`, `bugs`, `debug`, `decisions`, `specs`, `handoffs`.
5. Chạy validation.

## Cách đọc

Luôn bắt đầu từ:

```text
my_build/INDEX.md
```

Sau đó đọc theo router trong INDEX. Không scan toàn bộ project nếu task không cần.

## Ghi nhận thay đổi mới

```bash
python3 my_build/scripts/record_change.py --type feature --title "Add user login"
python3 my_build/scripts/record_change.py --type bug --title "Payment retry creates duplicate invoice"
python3 my_build/scripts/record_change.py --type decision --title "Use PostgreSQL for billing data"
python3 my_build/scripts/record_change.py --type note --title "Kafka retry gotcha"
```

## Validation

```bash
python3 my_build/scripts/update_index.py
python3 my_build/scripts/validate_structure.py
python3 my_build/scripts/validate_manifest.py
python3 my_build/scripts/validate_links.py
python3 my_build/scripts/run_all_checks.py
```


## Quy tắc cập nhật nhanh

- Feature mới hoặc thay đổi behavior: cập nhật `my_build/features/`.
- Bug đã debug: cập nhật `my_build/bugs/` và `my_build/debug/quick-debug.md` nếu có lệnh kiểm tra nhanh.
- Quyết định kiến trúc: thêm ADR trong `my_build/decisions/`.
- Contract API/event/DB thay đổi: cập nhật `my_build/specs/`.
- Context cho AI/handoff thay đổi: cập nhật `my_build/handoffs/`.
