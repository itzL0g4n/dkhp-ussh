// ==============================================================================
// USSH SNIPER EXTENSION - CONTENT SCRIPT
// Ported from v4.py & dan_vao_console.js
// ==============================================================================

console.log("%c🔌 USSH SNIPER EXTENSION LOADED", "color: white; background: #2e7d32; font-size: 16px; padding: 5px;");

let intervalId = null;
let isHunting = false;
let configData = null;

// URL configs
const URL_GET_DATA = "https://hcmussh.edu.vn/api/dkmh/hoc-phan/get-data";
const URL_REGISTER = "https://hcmussh.edu.vn/api/dkmh/dang-ky-hoc-phan";

// ==============================================================================
// MESSAGE LISTENER
// ==============================================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "START") {
        console.log("🚀 Lệnh START nhận được. Cấu hình:", request.config);
        configData = request.config;
        configData.targets = JSON.parse(request.config.targets);
        startLoop();
        sendResponse({ status: "started" });
    } else if (request.action === "STOP") {
        console.log("⛔ Lệnh STOP nhận được.");
        stopLoop();
        sendResponse({ status: "stopped" });
    } else if (request.action === "TOGGLE_CONSOLE") {
        if (request.enabled) injectConsoleScript();
        sendResponse({ status: "ok" });
    }
});

// ==============================================================================
// CORE LOGIC (V4.PY PORT)
// ==============================================================================

function startLoop() {
    if (isHunting) return;
    isHunting = true;
    showToast("🚀 Đã bắt đầu săn môn!", "green");

    // Chạy ngay lần đầu
    checkSlotAndHunt();

    // Lặp mỗi 1 giây (1000ms)
    intervalId = setInterval(checkSlotAndHunt, 1000);
}

function stopLoop() {
    isHunting = false;
    if (intervalId) clearInterval(intervalId);
    showToast("⛔ Đã dừng săn.", "red");
}

async function checkSlotAndHunt() {
    if (!configData || configData.targets.length === 0) {
        console.log("Đã săn hết hoặc chưa có target.");
        stopLoop();
        return;
    }

    try {
        const timestamp = new Date().getTime();

        const payload = new URLSearchParams();
        payload.append('cauHinh[theoKeHoach]', '1');
        payload.append('cauHinh[ngoaiKeHoach]', '0');
        payload.append('cauHinh[ngoaiCtdt]', '0');
        payload.append('cauHinh[chuyenLop]', '1');
        payload.append('cauHinh[ghepLop]', '0');
        payload.append('cauHinh[ngoaiNgu]', '1');
        payload.append('cauHinh[heGhep]', '');
        payload.append('cauHinh[isChanHocVuot]', '0');
        payload.append('cauHinh[namHoc]', configData.namHoc);
        payload.append('cauHinh[hocKy]', configData.hocKy);
        payload.append('cauHinh[id]', configData.configId);

        const response = await fetch(`${URL_GET_DATA}?t=${timestamp}`, {
            method: 'POST',
            body: payload,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            console.warn(`Lỗi lấy dữ liệu: ${response.status}`);
            return;
        }

        const data = await response.json();

        // Duyệt ngược để có thể xóa phần tử
        for (let i = configData.targets.length - 1; i >= 0; i--) {
            const target = configData.targets[i];
            let foundClass = null;

            if (target.ma_lop_hp && target.ma_lop_hp.length > 5) {
                // Cách 1: Tìm đích danh
                foundClass = findSpecificClassRecursive(data, target.ma_lop_hp);
            } else {
                // Cách 2: Tìm tự động theo Mã Môn
                foundClass = findAnyOpenClassRecursive(data, target.ma_mon);
            }

            if (foundClass) {
                const realClassId = foundClass.maLopHocPhan || foundClass.maHocPhan;
                const siSo = parseInt(foundClass.siSo || 9999);
                const maxSlot = parseInt(foundClass.soLuongDuKien || 0);

                console.log(`🔎 Môn ${target.ten_goi_nho} (${realClassId}): ${siSo}/${maxSlot}`);

                if (siSo < maxSlot) {
                    console.log(`🔥 CÓ SLOT TẠI ${realClassId}! ĐANG BẮN...`);
                    showToast(`🔥 Có slot ${target.ten_goi_nho}! Đang bắn...`, "orange");

                    const success = await fireRegistration(target, realClassId);
                    if (success) {
                        console.log(`✅ Đã đăng ký xong môn ${target.ten_goi_nho}. Xóa khỏi list.`);
                        configData.targets.splice(i, 1);

                        // Cập nhật lại UI popup (nếu cần thiết, lưu lại storage)
                        chrome.storage.local.set({ targets: JSON.stringify(configData.targets) });
                    }
                }
            }
        }

    } catch (e) {
        console.error("Lỗi trong vòng lặp hunting:", e);
    }
}

function findSpecificClassRecursive(obj, classId) {
    if (typeof obj === 'object' && obj !== null) {
        if (obj.maHocPhan === classId || obj.maLopHocPhan === classId) {
            return obj;
        }

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const res = findSpecificClassRecursive(obj[key], classId);
                if (res) return res;
            }
        }
    }
    return null;
}

function findAnyOpenClassRecursive(obj, subjectId) {
    if (typeof obj === 'object' && obj !== null) {
        if (obj.maMonHoc === subjectId) {
            const siSo = parseInt(obj.siSo || 9999);
            const maxSlot = parseInt(obj.soLuongDuKien || 0);
            if (siSo < maxSlot) {
                return obj;
            }
        }

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const res = findAnyOpenClassRecursive(obj[key], subjectId);
                if (res) return res;
            }
        }
    }
    return null;
}

async function fireRegistration(target, classId) {
    const timestamp = new Date().getTime();

    // URLSearchParams for application/x-www-form-urlencoded
    const payload = new URLSearchParams();
    payload.append('hocPhan', classId);
    payload.append('filter[cauHinh][id]', configData.configId);
    payload.append('filter[cauHinh][namHoc]', configData.namHoc);
    payload.append('filter[cauHinh][hocKy]', configData.hocKy);
    payload.append('filter[maMonHoc]', target.ma_mon);
    payload.append('filter[isHocVuot]', 'false');
    payload.append('filter[loaiMonHoc]', '0');
    payload.append('filter[tkbSoLuongDuKienMax]', '200');
    payload.append('filter[tenMonHoc]', target.ten_mon_full);
    payload.append('filter[theoKeHoach]', 'true');
    payload.append('filter[rotMon]', '5');

    try {
        const response = await fetch(`${URL_REGISTER}?t=${timestamp}`, {
            method: 'POST',
            body: payload,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const text = await response.text();

        if (response.ok) {
            if (text.includes("maLoaiDky")) {
                showToast(`✅ THÀNH CÔNG: ${target.ten_goi_nho}`, "green");
                return true;
            } else {
                try {
                    const json = JSON.parse(text);
                    showToast(`⚠️ Server báo: ${json.message || text}`, "orange");
                } catch {
                    showToast(`⚠️ Phản hồi lạ: ${text}`, "orange");
                }
            }
        } else {
            showToast(`❌ HTTP Error ${response.status}`, "red");
        }
    } catch (e) {
        showToast(`❌ Lỗi kết nối: ${e.message}`, "red");
    }
    return False;
}

// ==============================================================================
// UTILS & DAN VAO CONSOLE INTEGRATION
// ==============================================================================

function showToast(text, color = "blue") {
    let div = document.createElement("div");
    div.style.cssText = `position:fixed; bottom:20px; left:20px; background:${color}; color:white; padding:10px 20px; font-weight:bold; z-index:999999; border-radius:5px; box-shadow:0 0 10px rgba(0,0,0,0.5); font-family:sans-serif;`;
    div.innerText = text;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// Inject dan_vao_console code into the MAIN world
function injectConsoleScript() {
    console.log("💉 Injecting Dan Vao Console...");

    // Check if already injected
    if (document.getElementById('ussh-sniper-console')) return;

    const script = document.createElement('script');
    script.id = 'ussh-sniper-console';
    script.src = chrome.runtime.getURL('injected_console.js');
    script.onload = function () {
        this.remove(); // Clean up tag after execution
    };
    (document.head || document.documentElement).appendChild(script);
}

// Check initial state from storage to maybe auto-enable console
chrome.storage.local.get(['consoleEnabled'], (res) => {
    if (res.consoleEnabled) {
        injectConsoleScript();
    }
});
