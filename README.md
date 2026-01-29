# HCMUSSH Course Sniper Tool 🎯

Công cụ hỗ trợ đăng ký học phần tự động dành cho sinh viên HCMUSSH. 
> **Cảnh báo:** Chỉ sử dụng cho mục đích nghiên cứu kỹ thuật. Tác giả không chịu trách nhiệm cho bất kỳ khiếu nại nào từ phía nhà trường. Hãy sử dụng một cách thông minh!

## 📂 Cấu trúc dự án
1. `sniper_ussh.py`: Script Python thực hiện bắn request đăng ký.
2. `dan_vao_console.js`: Script JavaScript giúp "soi" Config ID và cấu trúc Payload ngay trên trình duyệt.

## 🚀 Hướng dẫn sử dụng

### Bước 1: Lấy ID đợt đăng ký (Config ID)
1. Truy cập trang chọn đợt đăng ký của trường.
2. Nhấn **F12** > Tab **Console** > Dán nội dung file `dan_vao_console.js` và nhấn Enter.
3. Script sẽ tự động quét và in ra danh sách các đợt (kể cả đợt chưa mở). Hãy copy số `CONFIG_ID` của đợt bạn muốn săn.

### Bước 2: Lấy Cookie (Header String)
1. Sử dụng extension **Cookie-Editor**.
2. Tại trang đăng ký, chọn **Export** > **Header String**. 
3. Lưu chuỗi này lại để dán vào file Python.

### Bước 3: Cấu hình mục tiêu (Targets)
Mở `sniper_ussh.py` bằng trình soạn thảo văn bản. Tại phần `TARGETS`, bạn có 2 lựa chọn:

* **Chế độ săn đích danh:** Điền đầy đủ `ma_lop_hp` (Ví dụ: `2520VNH070L01`). Tool sẽ chỉ tập trung săn đúng lớp này.
* **Chế độ săn tự động (Dành cho môn Thể dục/Môn chung):** Để trống mã lớp (`"ma_lop_hp": ""`) và chỉ điền `ma_mon`. Tool sẽ tự quét toàn bộ danh sách lớp của môn đó, hễ lớp nào còn chỗ trống là "chốt đơn" ngay lập tức.

### Bước 4: Khởi chạy
1. Cài đặt thư viện:
```
pip install requests colorama
```

2. Chạy tool:
```
python sniper_ussh.py
```


*(Khuyến khích chạy trước giờ G khoảng 30-60 giây để tối ưu tốc độ phản xạ).*

## 💡 Mẹo nhỏ

* Nếu chạy tool mà báo lỗi `401`, hãy lấy lại Cookie mới (thường Cookie hết hạn sau 30-60 phút).
