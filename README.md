# HCMUSSH Course Sniper Tool 🎯

Tool hỗ trợ đăng ký học phần tự động (Sniper) cho sinh viên HCMUSSH.
> **Lưu ý:** Tool chỉ phục vụ mục đích nghiên cứu học tập. Tác giả không chịu trách nhiệm về việc sử dụng. Hãy sử dụng nếu bạn biết bạn đang làm gì!!!!

## 📂 Cấu trúc
1. `sniper_ussh.py`: Tool chính (Chạy bằng Python).
2. `dan_vao_console.js`: Script hỗ trợ lấy ID cấu hình và Payload chuẩn.

## 🚀 Hướng dẫn sử dụng

### Bước 1: Lấy dữ liệu cấu hình (Config ID & Mã lớp)
1. Đăng nhập vào trang đăng ký học phần.
2. Nhấn **F12** > Tab **Console** > Copy nội dung file `dan_vao_console.js` dán vào và Enter.
3. Tìm đến đợt đăng kí cần snipe
4. **Copy lại** `CONFIG_ID` hiện ra trong Console. Đây chính là mã định danh của đợt đăng kí.

### Bước 2: Lấy Cookie (Dùng Extension)
1. Cài đặt extension **Cookie-Editor** (Chrome/Edge/Firefox).
2. Tại trang đăng ký học phần, bấm vào icon Cookie-Editor.
3. Chọn **Export** > **Export as Header String**.
4. Cookie đã được copy vào clipboard.

### Bước 3: Cấu hình và Chạy
1. Cài thư viện:
```
   pip install requests colorama
```

2. Mở file `sniper_ussh.py`, điền các thông tin đã lấy ở trên:
* `COOKIE`: Dán chuỗi vừa export từ extension.
* `CONFIG_ID`: ID đợt đăng ký (lấy từ Bước 1).
* `TARGETS`: Điền thông lớp học phần muốn săn.


3. Chạy tool (Nên chạy gần sát giờ G để tránh gửi request quá nhiều đến server trường và bị rate limit:
```
python sniper_ussh.py
```
