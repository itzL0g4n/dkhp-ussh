# USSH Course Sniper Extension 🎯

Tool hỗ trợ đăng ký học phần tự động cho sinh viên USSH (ĐHQG-HCM), được chuyển đổi từ Python Script sang Chrome Extension tiện lợi.

## Tính Năng Chính

1.  **Săn Môn Tự Động (Auto Sniper)**:
    -   Tự động quét và đăng ký ngay khi có slot.
    -   Hỗ trợ săn đích danh (theo Mã Lớp) hoặc săn tự động (bất kỳ lớp nào của Môn đó).
    -   Chạy trực tiếp trên trình duyệt, sử dụng phiên đăng nhập hiện tại (không cần copy cookie thủ công).

2.  **Giao Diện Quản Lý Trực Quan**:
    -   Thêm/Xóa môn học dễ dàng bằng giao diện thẻ (Card UI).
    -   Không cần sửa file code hay cấu hình JSON phức tạp.

3.  **Công Cụ Hỗ Trợ (Dan Vao Console)**:
    -   **Packet Sniffer**: Bắt và hiển thị các gói tin (Request/Response) ẩn mà web gửi đi.
    -   **UI Unlocker**: Mở khóa các nút bị ẩn/disabled trên trang web.
    -   **Cookie Display**: Xem nhanh Cookie hiện tại để debug nếu cần.

## Cài Đặt

Do tool này không có trên Chrome Web Store (hàng "nhà làm"), bạn cần cài thủ công:

1.  Tải và giải nén thư mục về máy tại [ĐÂY](https://github.com/itzL0g4n/dkhp-ussh/releases/download/v1.0.0/chrome_extension.zip).
2.  Mở trình duyệt (Chrome, Edge, Brave...), truy cập địa chỉ: `chrome://extensions/`
3.  Bật chế độ **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải.
4.  Bấm nút **Load unpacked** (Tải tiện ích đã giải nén).
5.  Chọn thư mục `chrome_extension` từ source code.

## Hướng Dẫn Sử Dụng

### 1. Chuẩn Bị
-   Truy cập trang đăng ký học phần: `https://hcmussh.edu.vn/user/dang-ky-hoc-phan`
-   Đăng nhập tài khoản sinh viên.

### 2. Cấu Hình Săn Môn
-   Bấm vào icon **USSH Sniper** trên thanh công cụ.
-   Điền thông tin đợt đăng ký (thường thì tool sẽ chạy đúng với năm học/học kỳ hiện tại, bạn có thể chỉnh nếu cần):
    -   **Config ID**, **Năm Học**, **Học Kỳ**.
-   **Thêm Môn Cần Săn**:
    -   Bấm nút `+ Thêm Môn`.
    -   Điền **Tên gợi nhớ** (VD: Văn học).
    -   Điền **Mã Môn** (Bắt buộc, VD: `VNH070`).
    -   Điền **Mã Lớp HP** (Tùy chọn):
        -   Nếu điền cụ thể (VD: `2520VNH070L01`): Tool chỉ săn đúng lớp này.
        -   Nếu để trống: Tool sẽ tìm **bất kỳ lớp nào** của môn đó còn slot.

### 3. Bắt Đầu Chạy
-   Bấm nút **🚀 BẮT ĐẦU SĂN**.
-   Tool sẽ chạy ngầm trong tab hiện tại. Bạn sẽ thấy thông báo (Toast) xuất hiện trên góc màn hình báo trạng thái.
-   **Lưu ý**: Cần giữ tab `hcmussh.edu.vn` mở (có thể ghim tab hoặc để sang màn hình khác), không được tắt tab này.

### 4. Tính Năng Nâng Cao (Console Sniffer)
-   Bật công tắc **🔥 Console Sniffer & Unlocker**.
-   **Tải lại trang (F5)** để kích hoạt.
-   Mở **Developer Tools** (F12) -> Chuyển sang tab **Console**.
-   Bạn sẽ thấy tool in ra các request API màu mè, giúp bạn biết trang web đang gửi/nhận dữ liệu gì.

## ⚠️ Lưu Ý Quan Trọng
-   Tool được viết cho mục đích học tập và nghiên cứu (Educational Purpose).
-   Tác giả không chịu trách nhiệm về việc sử dụng tool vào mục đích xấu hoặc vi phạm quy định của nhà trường.
-   Hãy sử dụng một cách văn minh và có chừng mực.


