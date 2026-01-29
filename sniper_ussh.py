import requests
import time
import urllib3
import json
from datetime import datetime
from colorama import Fore, Style, init

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
init(autoreset=True)

# ==============================================================================
# PHẦN 1: CẤU HÌNH
# ==============================================================================

# 1. Cookie
COOKIE = "dhkhxhnv-dhbk-dhqgtphcm=s%3AQENBbPWKbUlqLPzqY1uVkimE4usQgdBxGDRmNPce80EemEe4Z1OXeU.YDSk3zoj6BqChbZAnnJIKzBsRwJ9Gir4JgdJNmuU7b4"

# 2. Thông tin đợt đăng ký 
CONFIG_ID = "1686"          
NAM_HOC = "2025 - 2026"     
HOC_KY = "2"                

# 3. Môn cần săn (TARGETS)
TARGETS = [
    # TRƯỜNG HỢP 1: BIẾT RÕ MÃ LỚP (Săn đích danh)
    {
        "ten_goi_nho": "Văn học VN",
        "ma_lop_hp": "2520VNH070L01",   # <--- Có mã lớp cụ thể
        "ma_mon": "VNH070",
        "ten_mon_full": "Tổng quan văn học Việt Nam"
    },
    
    # TRƯỜNG HỢP 2: KHÔNG BIẾT MÃ LỚP (Săn tự động bất kỳ lớp nào của môn này)
    {
        "ten_goi_nho": "Bóng chuyền",
        "ma_lop_hp": "",                # <--- ĐỂ TRỐNG: Tool sẽ tự tìm lớp cho bạn
        "ma_mon": "GDTC_BC",            # <--- BẮT BUỘC PHẢI ĐÚNG MÃ MÔN
        "ten_mon_full": "Giáo dục thể chất: Bóng chuyền" # Tên môn (để log cho đẹp)
    }
]

# 4. Cấu hình mạng
URL_GET_DATA = "https://hcmussh.edu.vn/api/dkmh/hoc-phan/get-data"
URL_REGISTER = "https://hcmussh.edu.vn/api/dkmh/dang-ky-hoc-phan"
DELAY = 1.0 

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
# PHẦN 2: CÁC HÀM XỬ LÝ (ĐÃ NÂNG CẤP)
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

# --- Hàm cũ: Tìm chính xác mã lớp ---
def find_specific_class_recursive(obj, class_id):
    if isinstance(obj, dict):
        if obj.get('maHocPhan') == class_id or obj.get('maLopHocPhan') == class_id:
            return obj
        for k, v in obj.items():
            res = find_specific_class_recursive(v, class_id)
            if res: return res
    elif isinstance(obj, list):
        for item in obj:
            res = find_specific_class_recursive(item, class_id)
            if res: return res
    return None

# --- Hàm MỚI: Tìm lớp bất kỳ theo Mã Môn mà còn slot ---
def find_any_open_class_recursive(obj, subject_id):
    """
    Duyệt đệ quy tìm bất kỳ lớp nào có maMonHoc trùng khớp VÀ còn chỗ
    """
    if isinstance(obj, dict):
        # Kiểm tra xem node này có phải là lớp học của môn cần tìm không
        # Lưu ý: key 'maMonHoc' phải khớp với cấu trúc JSON của trường
        if obj.get('maMonHoc') == subject_id:
            si_so = int(obj.get('siSo', 9999))
            max_slot = int(obj.get('soLuongDuKien', 0))
            
            # Nếu còn chỗ -> Trả về ngay lớp này
            if si_so < max_slot:
                return obj
            # Nếu hết chỗ -> Vẫn trả về để log biết là có lớp nhưng đầy (Optional logic)
            # Ở đây ta ưu tiên tìm lớp còn chỗ, nên nếu đầy thì bỏ qua tìm tiếp
        
        for k, v in obj.items():
            res = find_any_open_class_recursive(v, subject_id)
            if res: return res

    elif isinstance(obj, list):
        for item in obj:
            res = find_any_open_class_recursive(item, subject_id)
            if res: return res
    return None

def fire_registration(target, found_class_id):
    """
    Bắn lệnh đăng ký với ID lớp vừa tìm được
    """
    payload_reg = {
        'hocPhan': found_class_id, # Sử dụng ID lớp tìm được tự động
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

    ts = int(time.time() * 1000)
    url_reg = f"{URL_REGISTER}?t={ts}"

    try:
        res = session.post(url_reg, data=payload_reg, timeout=5)
        
        if res.status_code == 200:
            if "maLoaiDky" in res.text:
                log(f"✅ ĐÃ ĐĂNG KÝ THÀNH CÔNG: {found_class_id}", "success")
                return True
            elif "message" in res.text: 
                try:
                    msg = res.json().get('message', res.text)
                    log(f"Server báo: {msg}", "warn")
                except:
                    log(f"Phản hồi lạ: {res.text}", "warn")
            else:
                log(f"Phản hồi lạ: {res.text}", "warn")
        else:
            log(f"Đăng ký thất bại (HTTP {res.status_code})", "error")
            
    except Exception as e:
        log(f"Lỗi kết nối khi bắn: {e}", "error")
    
    return False

def check_slot_and_hunt():
    global TARGETS
    
    if not TARGETS:
        print(f"\n{Fore.GREEN}{Style.BRIGHT}=== CHÚC MỪNG! ĐÃ SĂN HẾT CÁC MÔN! ===")
        exit()

    try:
        # Payload lấy dữ liệu
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
        response = session.post(url_check, data=data_lobby, timeout=10)

        if response.status_code != 200:
            log(f"Lỗi lấy dữ liệu: {response.status_code}", "error")
            return

        try:
            json_data = response.json()
            
            # Duyệt ngược danh sách target
            for i in range(len(TARGETS) - 1, -1, -1):
                target = TARGETS[i]
                
                found_class_obj = None
                
                # --- LOGIC QUAN TRỌNG: XÁC ĐỊNH CÁCH TÌM ---
                if target['ma_lop_hp'] and len(target['ma_lop_hp']) > 5:
                    # CÁCH 1: Nếu user điền mã lớp -> Tìm đích danh
                    found_class_obj = find_specific_class_recursive(json_data, target['ma_lop_hp'])
                else:
                    # CÁCH 2: Nếu mã lớp trống -> Tìm tự động theo Mã Môn
                    # log(f"Đang tự động tìm lớp cho môn {target['ma_mon']}...", "info")
                    found_class_obj = find_any_open_class_recursive(json_data, target['ma_mon'])

                # --- XỬ LÝ KẾT QUẢ TÌM KIẾM ---
                if found_class_obj:
                    # Lấy thông tin từ lớp tìm được
                    real_class_id = found_class_obj.get('maLopHocPhan') or found_class_obj.get('maHocPhan')
                    si_so = int(found_class_obj.get('siSo', 9999))
                    max_slot = int(found_class_obj.get('soLuongDuKien', 0))
                    
                    log(f"Môn {target['ten_goi_nho']} (Lớp {real_class_id}): {si_so}/{max_slot}", "warn")
                    
                    if si_so < max_slot:
                        log(f"🔥 CÓ SLOT TẠI {real_class_id}! BẮN NGAY...", "success")
                        
                        # Truyền ID lớp thực tế vừa tìm được vào hàm đăng ký
                        if fire_registration(target, real_class_id):
                            print(f"{Fore.MAGENTA}>>> Xóa {target['ten_goi_nho']} khỏi danh sách săn <<<")
                            TARGETS.pop(i)
                    else:
                        pass # Đầy thì chờ vòng sau
                else:
                    # Không tìm thấy lớp nào (hoặc lớp đầy hết ở chế độ tự động)
                    pass

        except Exception as e:
            pass 

    except Exception as e:
        log(f"Lỗi mạng: {e}", "error")

if __name__ == "__main__":
    print(f"{Fore.GREEN}--- USSH SNIPER V4 (AUTO DETECT CLASS) ---")
    print(f"Target: {len(TARGETS)} môn")
    try:
        while True:
            check_slot_and_hunt()
            time.sleep(DELAY)
    except KeyboardInterrupt:
        print("\nĐã dừng tool.")
