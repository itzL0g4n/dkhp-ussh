import requests
import time
import urllib3
import json
import threading
from datetime import datetime
from colorama import Fore, Style, init

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
init(autoreset=True)

class SniperEngine:
    def __init__(self):
        self.is_running = False
        self.logs = []
        self.lock = threading.Lock()
        
        # Default Configuration
        self.config = {
            "cookie": "",
            "config_id": "1686",
            "nam_hoc": "2025 - 2026",
            "hoc_ky": "2",
            "targets": [],
            "delay": 1.0,
            "url_get_data": "https://hcmussh.edu.vn/api/dkmh/hoc-phan/get-data",
            "url_register": "https://hcmussh.edu.vn/api/dkmh/dang-ky-hoc-phan"
        }
        
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://hcmussh.edu.vn',
            'Referer': 'https://hcmussh.edu.vn/user/dang-ky-hoc-phan',
            'X-Requested-With': 'XMLHttpRequest'
        }
        
        self.session = requests.Session()

    def log(self, msg, type="info"):
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        log_entry = {
            "timestamp": timestamp,
            "message": msg,
            "type": type
        }
        with self.lock:
            self.logs.append(log_entry)
            # Keep log size manageable
            if len(self.logs) > 500:
                self.logs.pop(0)
        
        # Still print to console for debugging
        if type == "success":
            print(f"{Fore.GREEN}[{timestamp}] 🎯 {msg}")
        elif type == "error":
            print(f"{Fore.RED}[{timestamp}] ❌ {msg}")
        elif type == "warn":
            print(f"{Fore.YELLOW}[{timestamp}] ⚠️ {msg}")
        else:
            print(f"{Fore.CYAN}[{timestamp}] ℹ️ {msg}")

    def update_config(self, new_config):
        """Updates configuration safely"""
        # Always update cookie in headers when config changes
        if "cookie" in new_config:
            self.config["cookie"] = new_config["cookie"]
            self.headers["Cookie"] = new_config["cookie"]
            self.session.headers.update(self.headers)
            
        # Update other keys
        for key, value in new_config.items():
            if key != "cookie": # Already handled
                self.config[key] = value
                
        self.log("Configuration updated", "info")

    def find_specific_class_recursive(self, obj, class_id):
        if isinstance(obj, dict):
            if obj.get('maHocPhan') == class_id or obj.get('maLopHocPhan') == class_id:
                return obj
            for k, v in obj.items():
                res = self.find_specific_class_recursive(v, class_id)
                if res: return res
        elif isinstance(obj, list):
            for item in obj:
                res = self.find_specific_class_recursive(item, class_id)
                if res: return res
        return None

    def find_any_open_class_recursive(self, obj, subject_id):
        if isinstance(obj, dict):
            if obj.get('maMonHoc') == subject_id:
                si_so = int(obj.get('siSo', 9999))
                max_slot = int(obj.get('soLuongDuKien', 0))
                if si_so < max_slot:
                    return obj
            for k, v in obj.items():
                res = self.find_any_open_class_recursive(v, subject_id)
                if res: return res
        elif isinstance(obj, list):
            for item in obj:
                res = self.find_any_open_class_recursive(item, subject_id)
                if res: return res
        return None

    def fire_registration(self, target, found_class_id):
        payload_reg = {
            'hocPhan': found_class_id,
            'filter[cauHinh][id]': self.config['config_id'],
            'filter[cauHinh][namHoc]': self.config['nam_hoc'],
            'filter[cauHinh][hocKy]': self.config['hoc_ky'],
            'filter[maMonHoc]': target['ma_mon'],
            'filter[isHocVuot]': 'false',
            'filter[loaiMonHoc]': '0',
            'filter[tkbSoLuongDuKienMax]': '200',
            'filter[tenMonHoc]': target['ten_mon_full'],
            'filter[theoKeHoach]': 'true',
            'filter[rotMon]': '5'
        }

        ts = int(time.time() * 1000)
        url_reg = f"{self.config['url_register']}?t={ts}"

        try:
            res = self.session.post(url_reg, data=payload_reg, timeout=5)
            
            if res.status_code == 200:
                if "maLoaiDky" in res.text:
                    self.log(f"✅ ĐÃ ĐĂNG KÝ THÀNH CÔNG: {found_class_id}", "success")
                    return True
                elif "message" in res.text: 
                    try:
                        msg = res.json().get('message', res.text)
                        self.log(f"Server báo: {msg}", "warn")
                    except:
                        self.log(f"Phản hồi lạ: {res.text}", "warn")
                else:
                    self.log(f"Phản hồi lạ: {res.text}", "warn")
            else:
                self.log(f"Đăng ký thất bại (HTTP {res.status_code})", "error")
                
        except Exception as e:
            self.log(f"Lỗi kết nối khi bắn: {e}", "error")
        
        return False

    def check_slot_and_hunt(self):
        if not self.config['targets']:
            self.log("Đã săn hết hoặc chưa có mục tiêu!", "success")
            self.stop()
            return

        try:
            data_lobby = {
                'cauHinh[theoKeHoach]': '1',
                'cauHinh[ngoaiKeHoach]': '0',
                'cauHinh[ngoaiCtdt]': '0',
                'cauHinh[chuyenLop]': '1',
                'cauHinh[ghepLop]': '0',
                'cauHinh[ngoaiNgu]': '1',
                'cauHinh[heGhep]': '',
                'cauHinh[isChanHocVuot]': '0',
                'cauHinh[namHoc]': self.config['nam_hoc'],
                'cauHinh[hocKy]': self.config['hoc_ky'],
                'cauHinh[id]': self.config['config_id']
            }
            
            ts = int(time.time() * 1000)
            url_check = f"{self.config['url_get_data']}?t={ts}"
            response = self.session.post(url_check, data=data_lobby, timeout=10)

            if response.status_code != 200:
                self.log(f"Lỗi lấy dữ liệu: {response.status_code}", "error")
                return

            try:
                json_data = response.json()
                
                # Iterate backwards to safely remove items
                for i in range(len(self.config['targets']) - 1, -1, -1):
                    target = self.config['targets'][i]
                    found_class_obj = None
                    
                    if target.get('ma_lop_hp') and len(target['ma_lop_hp']) > 5:
                        found_class_obj = self.find_specific_class_recursive(json_data, target['ma_lop_hp'])
                    else:
                        found_class_obj = self.find_any_open_class_recursive(json_data, target['ma_mon'])

                    if found_class_obj:
                        real_class_id = found_class_obj.get('maLopHocPhan') or found_class_obj.get('maHocPhan')
                        si_so = int(found_class_obj.get('siSo', 9999))
                        max_slot = int(found_class_obj.get('soLuongDuKien', 0))
                        
                        self.log(f"Môn {target['ten_goi_nho']} (Lớp {real_class_id}): {si_so}/{max_slot}", "warn")
                        
                        if si_so < max_slot:
                            self.log(f"🔥 CÓ SLOT TẠI {real_class_id}! BẮN NGAY...", "success")
                            if self.fire_registration(target, real_class_id):
                                self.log(f">>> Xóa {target['ten_goi_nho']} khỏi danh sách săn <<<", "success")
                                self.config['targets'].pop(i)
                    else:
                         pass # Nothing found
                         
            except Exception as e:
                self.log(f"Lỗi xử lý JSON: {e}", "error")

        except Exception as e:
            self.log(f"Lỗi mạng loop: {e}", "error")

    def run_loop(self):
        self.log("Sniper Engine Started", "success")
        while self.is_running:
            self.check_slot_and_hunt()
            time.sleep(float(self.config['delay']))
        self.log("Sniper Engine Stopped", "warn")

    def start(self):
        if not self.is_running:
            self.is_running = True
            t = threading.Thread(target=self.run_loop)
            t.daemon = True
            t.start()
            return True
        return False

    def stop(self):
        self.is_running = False
        return True

    def get_logs(self):
        # Retrieve logs and maybe clear them or keep them? 
        # For this simple app, we just return the full list or last N
        # Ideally, we should have a "since_timestamp" or just return all and let frontend filter
        return self.logs
