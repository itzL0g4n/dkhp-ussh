import requests
import time
import urllib3
import json
from datetime import datetime
from colorama import Fore, Style, init

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
init(autoreset=True)

# ==============================================================================
# PHẦN 1: CẤU HÌNH (HÃY ĐIỀN THÔNG TIN CỦA BẠN VÀO ĐÂY)
# ==============================================================================

# 1. Cookie (Lấy từ F12 -> Network -> Headers)
COOKIE = "nhập cookie của bạn vào đây"

# 2. Thông tin đợt đăng ký 
CONFIG_ID = "nhập id"          # cauHinh[id] | Mã định danh của Đợt đăng ký
NAM_HOC = "nhập năm học"     # cauHinh[namHoc] (Chú ý khoảng trắng y hệt log) #các thông tin này bạn có thể tìm trong log khi bạn thao tác đăng ký thủ công
HOC_KY = "nhập học kỳ"                # cauHinh[hocKy]

# 3. Môn cần săn (TARGETS)
# Bạn có thể thêm nhiều môn, tool sẽ săn lần lượt
TARGETS = [
    {
        "ten_goi_nho": "",          # Tên hiển thị log cho dễ nhìn, đặt gì cũng được
        "ma_lop_hp": "",         # <--- QUAN TRỌNG: Mã lớp học phần, ví dụ: 2520VNH073L01 | 2520 là tên khoá, VNH073 là mã môn, L01 là lớp (khi 1 môn có nhiều lớp)
        "ma_mon": "",                   # Mã môn học
        "ten_mon_full": "" # Tên đầy đủ của môn học
    },
    # Ví dụ thêm môn khác:
    # {
    #     "ten_goi_nho": "Triết học",
    #     "ma_lop_hp": "...",
    #     "ma_mon": "...",
    #     "ten_mon_full": "..."
    # }
]

# 4. Cấu hình mạng
URL_GET_DATA = "https://hcmussh.edu.vn/api/dkmh/hoc-phan/get-data"
URL_REGISTER = "https://hcmussh.edu.vn/api/dkmh/dang-ky-hoc-phan"
DELAY = 1.0 # Tốc độ kiểm tra (giây)

# Headers giả lập trình duyệt thật
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Cookie': COOKIE,
    'Origin': 'https://hcmussh.edu.vn',
    'Referer': 'https://hcmussh.edu.vn/user/dang-ky-hoc-phan',
    'X-Requested-With': 'XMLHttpRequest'
}

session = requests.Session()
session.headers.update(HEADERS)

# ==============================================================================
# PHẦN 2: CÁC HÀM XỬ LÝ
# ==============================================================================

def log(msg, type="info"):
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    if type == "success":
        print(f"{Fore.GREEN}[{timestamp}] 🎯 {msg}")
    elif type == "error":
        print(f"{Fore.RED}[{timestamp}] ❌ {msg}")
    elif type == "warn":
        print(f"{Fore.YELLOW}[{timestamp}] ⚠️ {msg}")
    else:
        print(f"{Fore.CYAN}[{timestamp}] ℹ️ {msg}")

def find_class_recursive(obj, class_id):
    """Hàm tìm kiếm thông tin lớp trong cục JSON trả về"""
    if isinstance(obj, dict):
        # Kiểm tra cả 2 trường maHocPhan và maLopHocPhan
        if obj.get('maHocPhan') == class_id or obj.get('maLopHocPhan') == class_id:
            return obj
        for k, v in obj.items():
            res = find_class_recursive(v, class_id)
            if res: return res
    elif isinstance(obj, list):
        for item in obj:
            res = find_class_recursive(item, class_id)
            if res: return res
    return None

def fire_registration(target):
    """
    Hàm bắn lệnh đăng ký (REQUEST QUAN TRỌNG)
    Trả về: True (Thành công) / False (Thất bại)
    """
    payload_reg = {
        'hocPhan': target['ma_lop_hp'],
        'filter[cauHinh][id]': CONFIG_ID,
        'filter[cauHinh][namHoc]': NAM_HOC,
        'filter[cauHinh][hocKy]': HOC_KY,
        'filter[maMonHoc]': target['ma_mon'],
        'filter[isHocVuot]': 'false',
        'filter[loaiMonHoc]': '0',
        'filter[tkbSoLuongDuKienMax]': '200',
        'filter[tenMonHoc]': target['ten_mon_full'],
        'filter[theoKeHoach]': 'true',
        'filter[rotMon]': '5'
    }

    # Thêm timestamp để tránh cache
    ts = int(time.time() * 1000)
    url_reg = f"{URL_REGISTER}?t={ts}"

    try:
        res = session.post(url_reg, data=payload_reg, timeout=5)
        
        # LOGIC KIỂM TRA THÀNH CÔNG DỰA TRÊN LOG BẠN CUNG CẤP
        if res.status_code == 200:
            # Server trả về {"maLoaiDky":"KH"} là tín hiệu thành công
            if "maLoaiDky" in res.text:
                log(f"✅ ĐÃ ĐĂNG KÝ THÀNH CÔNG MÔN: {target['ten_goi_nho']}", "success")
                return True
            # Trường hợp server trả về thông báo lỗi dạng JSON
            elif "message" in res.text: 
                try:
                    msg = res.json().get('message', res.text)
                    log(f"Server báo: {msg}", "warn")
                except:
                    log(f"Phản hồi lạ: {res.text}", "warn")
            else:
                log(f"Phản hồi lạ (Có thể thành công?): {res.text}", "warn")
        else:
            log(f"Đăng ký thất bại (HTTP {res.status_code})", "error")
            
    except Exception as e:
        log(f"Lỗi kết nối khi bắn: {e}", "error")
    
    return False

def check_slot_and_hunt():
    """
    Hàm chính: Quét slot và gọi hàm bắn
    """
    global TARGETS
    
    # Nếu danh sách trống thì dừng tool
    if not TARGETS:
        print(f"\n{Fore.GREEN}{Style.BRIGHT}==========================================")
        print(f"{Fore.GREEN}{Style.BRIGHT}   CHÚC MỪNG! ĐÃ SĂN HẾT CÁC MÔN!   ")
        print(f"{Fore.GREEN}{Style.BRIGHT}==========================================")
        exit()

    try:
        # Payload lấy dữ liệu (Lấy từ log số 1 của bạn)
        data_lobby = {
            'cauHinh[theoKeHoach]': '1',
            'cauHinh[ngoaiKeHoach]': '0',
            'cauHinh[ngoaiCtdt]': '0',
            'cauHinh[chuyenLop]': '1',
            'cauHinh[ghepLop]': '0',
            'cauHinh[ngoaiNgu]': '1',
            'cauHinh[heGhep]': '',
            'cauHinh[isChanHocVuot]': '0',
            'cauHinh[namHoc]': NAM_HOC,
            'cauHinh[hocKy]': HOC_KY,
            'cauHinh[id]': CONFIG_ID
        }
        
        ts = int(time.time() * 1000)
        url_check = f"{URL_GET_DATA}?t={ts}"

        log(f"Đang quét {len(TARGETS)} môn...", "info")
        response = session.post(url_check, data=data_lobby, timeout=10)

        if response.status_code != 200:
            log(f"Server Check Slot lỗi: {response.status_code}", "error")
            return

        try:
            json_data = response.json()
            
            # Duyệt ngược danh sách để có thể xóa phần tử an toàn
            for i in range(len(TARGETS) - 1, -1, -1):
                target = TARGETS[i]
                
                # Tìm thông tin lớp trong dữ liệu trả về
                class_info = find_class_recursive(json_data, target['ma_lop_hp'])

                if class_info:
                    si_so = int(class_info.get('siSo', 9999))
                    max_slot = int(class_info.get('soLuongDuKien', 0))
                    
                    if si_so < max_slot:
                        log(f"🔥 CÓ SLOT ({si_so}/{max_slot}) -> BẮN: {target['ten_goi_nho']}", "success")
                        
                        # Gọi hàm kiểm tra đăng ký
                        if fire_registration(target):
                            # Nếu thành công -> Xóa khỏi danh sách cần săn
                            print(f"{Fore.MAGENTA}>>> Xóa {target['ten_goi_nho']} khỏi danh sách săn <<<")
                            TARGETS.pop(i)
                    else:
                        print(f"{Fore.WHITE}   - {target['ten_goi_nho']}: {si_so}/{max_slot} (Đầy)")
                else:
                    # Nếu không tìm thấy lớp trong danh sách trả về
                    # 90% là do đã đăng ký thành công rồi nên nó ẩn đi
                    log(f"⚠️ Không thấy lớp {target['ten_goi_nho']} trong DS (Có thể đã ĐK xong?)", "warn")
                    
                    # Tùy chọn: Thử bắn 1 phát cầu may để verify
                    # if fire_registration(target):
                    #     TARGETS.pop(i)

        except Exception as e:
            pass # Lỗi JSON thường do server trả về HTML lỗi, bỏ qua

    except Exception as e:
        log(f"Lỗi mạng: {e}", "error")

# ==============================================================================
# MAIN PROGRAM
# ==============================================================================
if __name__ == "__main__":
    print(f"{Fore.GREEN}--- USSH SNIPER TOOL V3 (AUTO-STOP) ---")
    print(f"Target: {len(TARGETS)} môn")
    print("Nhấn Ctrl+C để dừng tool bất cứ lúc nào.\n")
    
    try:
        while True:
            check_slot_and_hunt()
            time.sleep(DELAY)
    except KeyboardInterrupt:
        print("\nĐã dừng tool.")
