# HCMUSSH Course Sniper Tool

Công cụ hỗ trợ đăng ký học phần tự động dành cho sinh viên HCMUSSH. 
> **Cảnh báo:** Chỉ sử dụng cho mục đích nghiên cứu kỹ thuật. Tác giả không chịu trách nhiệm cho bất kỳ khiếu nại nào từ phía nhà trường. Hãy sử dụng một cách thông minh!

Đối với các bạn không biết nhiều về python và cách config bằng hardcode, mình đã làm một phiên bản GUI trực quan hơn, tải tại tab release nhé!

## Cấu trúc dự án
1. `sniper_ussh.py`: Script Python thực hiện gửi request đăng ký.
2. `dan_vao_console.js`: Script JavaScript giúp xem Config ID và cấu trúc Payload.

## Hướng dẫn sử dụng

### Bước 1: Lấy ID đợt đăng ký (Config ID)
1. Truy cập trang chọn đợt đăng ký của trường.
2. Nhấn **F12** > Tab **Console** > Dán nội dung file `dan_vao_console.js` và nhấn Enter.
3. Script sẽ tự động quét và in ra danh sách các đợt (kể cả đợt chưa mở). Hãy copy số `CONFIG_ID` của đợt bạn muốn săn.

### Bước 2: Lấy Cookie (Header String)
1. Sử dụng extension [**Cookie-Editor**](https://chromewebstore.google.com/detail/hlkenndednhfkekhgcdicdfddnkalmdm?utm_source=item-share-cb).
2. Tại trang đăng ký, chọn **Export** > **Header String**. 
3. Lưu chuỗi này lại để dán vào file Python.

### Bước 3: Cấu hình mục tiêu (Targets)
Mở `sniper_ussh.py` bằng trình soạn thảo văn bản. Tại phần `TARGETS`, bạn có 2 lựa chọn:

* **Chế độ săn đích danh:** Điền đầy đủ `ma_lop_hp` (Ví dụ: `2520VNH070L01`). Tool sẽ chỉ tập trung săn đúng lớp này.
* **Chế độ săn tự động (Nếu bạn không biết chính xác mã lớp):** Để trống `"ma_lop_hp": ""` và chỉ điền `ma_mon`. Tool sẽ tự quét toàn bộ danh sách lớp của môn đó, so sánh với lịch học từ tài khoản của bạn và tự động đăng kí lớp phù hợp nhất.

### Bước 4: Khởi chạy
1. Cài đặt thư viện:
```
pip install requests colorama urllib3
```
2. Chạy tool:
```
python sniper_ussh.py
```


*(Khuyến khích chạy trước giờ G khoảng 30-60 giây để tối ưu tốc độ phản xạ, không nên treo trước nhiều tiếng vì có thể bị chặn IP).*

## Lưu ý

* Cookies của bạn sẽ hết hạn sau ~60p.
* Khi tool báo `ĐÃ ĐĂNG KÝ THÀNH CÔNG`, hãy vào web kiểm tra lại.
* Tool phụ thuộc rất lớn vào tốc độ mạng của bạn.











