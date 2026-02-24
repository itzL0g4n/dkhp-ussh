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

COOKIE = "nhập_cookie_của bạn"
CONFIG_ID = "nhập_id"          
NAM_HOC = "nhập_năm_học"     
HOC_KY = "nhập_học_kì"                

TARGETS = [
    # Môn tự động tìm lớp trống (sẽ né lớp trùng lịch)
    {
        "ten_goi_nho": "Tâm lý học đại cương",
        "ma_lop_hp": "",                
        "ma_mon": "DAI022",            
        "ten_mon_full": "Tâm lý học đại cương" 
    }
]

URL_GET_DATA = "https://hcmussh.edu.vn/api/dkmh/hoc-phan/get-data"
URL_REGISTER = "https://hcmussh.edu.vn/api/dkmh/dang-ky-hoc-phan"
DELAY = 1.0 

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Cookie': COOKIE
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

def is_conflict(target_class_id, json_data):
    """
    Hàm: Kiểm tra trùng lịch
    """
    registered_classes = json_data.get('hocPhanDangKy', [])
    
    if not registered_classes:
        return False
        
    all_weeks = json_data.get('listDataTuanHoc', [])
    if not all_weeks:
        return False

    # 1. Lấy danh sách ID các lớp đã có
    registered_ids = [c.get('maHocPhan') for c in registered_classes if c.get('maHocPhan')]
    
    if target_class_id in registered_ids:
        return True # Đã đăng ký môn này rồi

    # 2. Rút lịch học của lớp mới đang nhắm tới
    target_weeks = [w for w in all_weeks if w.get('maHocPhan') == target_class_id and not w.get('isNgayLe')]
    
    # 3. Rút lịch học của các môn hiện tại đang có
    registered_weeks = [w for w in all_weeks if w.get('maHocPhan') in registered_ids and not w.get('isNgayLe')]

    # 4. Thuật toán so sánh từng tuần, từng tiết
    for t_week in target_weeks:
        t_start = t_week.get('ngayBatDau', 0)
        t_end = t_week.get('ngayKetThuc', 0)

        for r_week in registered_weeks:
            r_start = r_week.get('ngayBatDau', 0)
            r_end = r_week.get('ngayKetThuc', 0)

            # Công thức va chạm thời gian
            if t_start < r_end and t_end > r_start:
                return True # BÁO ĐỎ: TRÙNG LỊCH!

    return False # Lịch sạch

def find_all_open_classes(obj, subject_id, specific_class_id=""):
    results = []
    
    def _search(node):
        if isinstance(node, dict):
            match_condition = False
            if specific_class_id:
                match_condition = (node.get('maHocPhan') == specific_class_id or node.get('maLopHocPhan') == specific_class_id)
            else:
                match_condition = (node.get('maMonHoc') == subject_id)

            if match_condition:
                real_class_id = node.get('maLopHocPhan') or node.get('maHocPhan')
                
                if real_class_id:
                    # BỘ LỌC: Nếu cục dữ liệu không có 'siSo' (là rác), ép nó thành 9999 để vứt đi
                    si_so = int(node.get('siSo', 9999))
                    max_slot = int(node.get('soLuongDuKien', 100)) 
                    tinh_trang = int(node.get('tinhTrang', 2)) 
                    
                    if si_so < max_slot and tinh_trang != 3:
                        results.append(node)
                    
            for v in node.values():
                _search(v)
        elif isinstance(node, list):
            for item in node:
                _search(item)
                
    _search(obj)
    
    # LỌC TRÙNG LẶP: Đảm bảo mỗi mã lớp chỉ xuất hiện 1 lần duy nhất
    unique_results = {}
    for cls in results:
        cid = cls.get('maLopHocPhan') or cls.get('maHocPhan')
        if cid not in unique_results:
            unique_results[cid] = cls
            
    return list(unique_results.values())

def fire_registration(target, found_class_id):
    """Hàm bắn đăng ký"""
    payload_reg = {
        'hocPhan': found_class_id,
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
                log(f"ĐÃ ĐĂNG KÝ THÀNH CÔNG: {found_class_id}", "success")
                return True
            elif "message" in res.text: 
                try:
                    msg = res.json().get('message', res.text)
                    log(f"Server báo: {msg}", "warn")
                except: pass
        else:
            log(f"Đăng ký thất bại (HTTP {res.status_code})", "error")
    except Exception as e:
        log(f"Lỗi kết nối khi bắn: {e}", "error")
    return False

def check_slot_and_hunt():
    global TARGETS
    if not TARGETS:
        print(f"\n{Fore.GREEN}{Style.BRIGHT}=== ĐÃ SĂN HẾT CÁC MÔN! ===")
        exit()

    try:
        #Bật "1" cho tất cả các loại Kế Hoạch để quét hết môn
        data_lobby = {
            'cauHinh[theoKeHoach]': '1', 
            'cauHinh[ngoaiKeHoach]': '1', 
            'cauHinh[ngoaiCtdt]': '1',
            'cauHinh[chuyenLop]': '1', 'cauHinh[ghepLop]': '0', 'cauHinh[ngoaiNgu]': '1',
            'cauHinh[heGhep]': '', 'cauHinh[isChanHocVuot]': '0',
            'cauHinh[namHoc]': NAM_HOC, 'cauHinh[hocKy]': HOC_KY, 'cauHinh[id]': CONFIG_ID
        }
        
        ts = int(time.time() * 1000)
        url_check = f"{URL_GET_DATA}?t={ts}"
        
        log(f"Đang quét {len(TARGETS)} môn...", "info")
        response = session.post(url_check, data=data_lobby, timeout=10)

        if response.status_code != 200: 
            log(f"Lỗi Server (HTTP {response.status_code}). Cookie có thể đã hết hạn!", "error")
            return

        try:
            json_data = response.json()
            
            for i in range(len(TARGETS) - 1, -1, -1):
                target = TARGETS[i]
                open_classes = find_all_open_classes(json_data, target['ma_mon'], target['ma_lop_hp'])

                if open_classes:
                    shot_fired = False
                    for cls in open_classes:
                        real_class_id = cls.get('maLopHocPhan') or cls.get('maHocPhan')
                        si_so = int(cls.get('siSo', 0))
                        max_slot = int(cls.get('soLuongDuKien', 100))

                        if is_conflict(real_class_id, json_data):
                            log(f"⚠️ {real_class_id} ({si_so}/{max_slot}): Bị TRÙNG LỊCH! Đang tìm lớp khác...", "warn")
                            continue 

                        log(f"🔥 CÓ SLOT TẠI {real_class_id} (LỊCH SẠCH)! BẮN...", "success")
                        if fire_registration(target, real_class_id):
                            print(f"{Fore.MAGENTA}>>> Xóa {target['ten_goi_nho']} khỏi danh sách săn <<<")
                            TARGETS.pop(i)
                            shot_fired = True
                            break 
                    
                    if not shot_fired:
                        log(f"Môn {target['ten_goi_nho']}: Các lớp còn trống đều bị trùng lịch.", "error")
                else:
                    print(f"{Fore.WHITE}   - {target['ten_goi_nho']}: Không tìm thấy lớp, các lớp đã đầy, hoặc bị khóa.")

        except Exception as e: 
            log(f"Lỗi đọc dữ liệu JSON: {e}", "error") 
    except Exception as e: 
        log(f"Lỗi mạng: {e}", "error")



if __name__ == "__main__":
    print(f"{Fore.GREEN}--- USSH SNIPER BY itzL0g4n ---")
    print(f"Target: {len(TARGETS)} môn")
    try:
        while True:
            check_slot_and_hunt()
            time.sleep(DELAY)
    except KeyboardInterrupt:
        print("\nĐã dừng tool.")
