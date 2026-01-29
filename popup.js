// Configuration
const CONFIG = {
    URL_GET_DATA: "https://hcmussh.edu.vn/api/dkmh/hoc-phan/get-data",
    URL_REGISTER: "https://hcmussh.edu.vn/api/dkmh/dang-ky-hoc-phan"
};

// Global state
let isRunning = false;
let targets = [];
let logBuffer = [];

// Utility: Format timestamp
function getTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
}

// Logging function
function log(msg, type = "info") {
    const timestamp = getTimestamp();
    let prefix = "ℹ️ ";
    let cssClass = "log-info";

    if (type === "success") {
        prefix = "✅ ";
        cssClass = "log-success";
    } else if (type === "error") {
        prefix = "❌ ";
        cssClass = "log-error";
    } else if (type === "warn") {
        prefix = "⚠️ ";
        cssClass = "log-warn";
    }

    const logEntry = `[${timestamp}] ${prefix}${msg}`;
    logBuffer.push({ text: logEntry, class: cssClass });

    // Keep only last 50 logs
    if (logBuffer.length > 50) {
        logBuffer.shift();
    }

    updateLogDisplay();
}

// Update log display
function updateLogDisplay() {
    const logBox = document.getElementById('log');
    logBox.innerHTML = logBuffer
        .map(entry => `<div class="log-line ${entry.class}">${entry.text}</div>`)
        .join('');
    logBox.scrollTop = logBox.scrollHeight;
}

// Find specific class by exact ID
function findSpecificClassRecursive(obj, classId) {
    if (typeof obj !== 'object' || obj === null) return null;

    if (Array.isArray(obj)) {
        for (let item of obj) {
            const result = findSpecificClassRecursive(item, classId);
            if (result) return result;
        }
    } else {
        if (obj.maHocPhan === classId || obj.maLopHocPhan === classId) {
            return obj;
        }
        for (let key in obj) {
            const result = findSpecificClassRecursive(obj[key], classId);
            if (result) return result;
        }
    }
    return null;
}

// Find any open class by subject code (v4 auto-detection feature)
function findAnyOpenClassRecursive(obj, subjectId) {
    if (typeof obj !== 'object' || obj === null) return null;

    if (Array.isArray(obj)) {
        for (let item of obj) {
            const result = findAnyOpenClassRecursive(item, subjectId);
            if (result) return result;
        }
    } else {
        if (obj.maMonHoc === subjectId) {
            const siSo = parseInt(obj.siSo || 9999);
            const maxSlot = parseInt(obj.soLuongDuKien || 0);
            
            // Return if slot available
            if (siSo < maxSlot) {
                return obj;
            }
        }
        for (let key in obj) {
            const result = findAnyOpenClassRecursive(obj[key], subjectId);
            if (result) return result;
        }
    }
    return null;
}

// Fire registration request
async function fireRegistration(target, foundClassId, cookie, configId, namHoc, hocKy) {
    const payload = new URLSearchParams({
        'hocPhan': foundClassId,
        'filter[cauHinh][id]': configId,
        'filter[cauHinh][namHoc]': namHoc,
        'filter[cauHinh][hocKy]': hocKy,
        'filter[maMonHoc]': target.ma_mon,
        'filter[isHocVuot]': 'false',
        'filter[loaiMonHoc]': '0',
        'filter[tkbSoLuongDuKienMax]': '200',
        'filter[tenMonHoc]': target.ten_mon_full,
        'filter[theoKeHoach]': 'true',
        'filter[rotMon]': '5'
    });

    const ts = Date.now();
    const url = `${CONFIG.URL_REGISTER}?t=${ts}`;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': cookie,
        'Origin': 'https://hcmussh.edu.vn',
        'Referer': 'https://hcmussh.edu.vn/user/dang-ky-hoc-phan',
        'X-Requested-With': 'XMLHttpRequest'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: payload.toString(),
            credentials: 'include'
        });

        if (response.status === 200) {
            const text = await response.text();
            if (text.includes("maLoaiDky")) {
                log(`✅ ĐÃ ĐĂNG KÝ THÀNH CÔNG: ${foundClassId}`, "success");
                return true;
            } else if (text.includes("message")) {
                try {
                    const data = JSON.parse(text);
                    log(`Server báo: ${data.message}`, "warn");
                } catch (e) {
                    log(`Phản hồi lạ: ${text}`, "warn");
                }
            } else {
                log(`Phản hồi lạ (Có thể thành công?): ${text}`, "warn");
            }
        } else {
            log(`Đăng ký thất bại (HTTP ${response.status})`, "error");
        }
    } catch (error) {
        log(`Lỗi kết nối khi bắn: ${error.message}`, "error");
    }

    return false;
}

// Check slots and hunt
async function checkSlotAndHunt(cookie, configId, namHoc, hocKy, delay) {
    if (targets.length === 0) {
        log("CHÚC MỪNG! ĐÃ SĂN HẾT CÁC MÔN!", "success");
        isRunning = false;
        updateControlButtons();
        return false;
    }

    const dataPayload = new URLSearchParams({
        'cauHinh[theoKeHoach]': '1',
        'cauHinh[ngoaiKeHoach]': '0',
        'cauHinh[ngoaiCtdt]': '0',
        'cauHinh[chuyenLop]': '1',
        'cauHinh[ghepLop]': '0',
        'cauHinh[ngoaiNgu]': '1',
        'cauHinh[heGhep]': '',
        'cauHinh[isChanHocVuot]': '0',
        'cauHinh[namHoc]': namHoc,
        'cauHinh[hocKy]': hocKy,
        'cauHinh[id]': configId
    });

    const ts = Date.now();
    const url = `${CONFIG.URL_GET_DATA}?t=${ts}`;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': cookie,
        'Origin': 'https://hcmussh.edu.vn',
        'Referer': 'https://hcmussh.edu.vn/user/dang-ky-hoc-phan',
        'X-Requested-With': 'XMLHttpRequest'
    };

    try {
        log(`Đang quét ${targets.length} môn...`, "info");
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: dataPayload.toString(),
            credentials: 'include'
        });

        if (response.status !== 200) {
            log(`Lỗi Check Slot: ${response.status}`, "error");
            return true;
        }

        try {
            const jsonData = await response.json();

            // Iterate backwards for safe removal
            for (let i = targets.length - 1; i >= 0; i--) {
                const target = targets[i];
                let foundClassObj = null;

                // v4.py logic: Check if ma_lop_hp is filled
                if (target.ma_lop_hp && target.ma_lop_hp.length > 5) {
                    // CASE 1: Specific class code provided - find exact match
                    foundClassObj = findSpecificClassRecursive(jsonData, target.ma_lop_hp);
                } else {
                    // CASE 2: Auto-detect - find any open class by subject code
                    foundClassObj = findAnyOpenClassRecursive(jsonData, target.ma_mon);
                }

                if (foundClassObj) {
                    const realClassId = foundClassObj.maLopHocPhan || foundClassObj.maHocPhan;
                    const siSo = parseInt(foundClassObj.siSo || 9999);
                    const maxSlot = parseInt(foundClassObj.soLuongDuKien || 0);

                    log(`Môn ${target.ten_goi_nho} (Lớp ${realClassId}): ${siSo}/${maxSlot}`, "warn");

                    if (siSo < maxSlot) {
                        log(`🔥 CÓ SLOT TẠI ${realClassId}! BẮN NGAY...`, "success");

                        if (await fireRegistration(target, realClassId, cookie, configId, namHoc, hocKy)) {
                            log(`>>> Xóa ${target.ten_goi_nho} khỏi danh sách săn <<<`, "info");
                            targets.splice(i, 1);
                            saveConfig();
                        }
                    }
                } else {
                    // Not found (full or unavailable)
                }
            }
        } catch (e) {
            // Silently fail on JSON parse errors
        }
    } catch (error) {
        log(`Lỗi mạng: ${error.message}`, "error");
    }

    return true;
}

// Main hunting loop
async function huntingLoop() {
    const cookie = document.getElementById('cookie').value;
    const configId = document.getElementById('configId').value;
    const namHoc = document.getElementById('schoolYear').value;
    const hocKy = document.getElementById('semester').value;
    const delay = parseFloat(document.getElementById('delay').value) * 1000;

    if (!cookie) {
        log("❌ Vui lòng nhập Cookie", "error");
        return;
    }

    if (targets.length === 0) {
        log("❌ Vui lòng thêm ít nhất một môn cần săn", "error");
        return;
    }

    log("🚀 Bắt đầu săn slot...", "success");

    while (isRunning) {
        const shouldContinue = await checkSlotAndHunt(cookie, configId, namHoc, hocKy, delay);
        if (!shouldContinue) break;
        
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (isRunning) {
        log("⏹️ Dừng tool.", "info");
    }

    isRunning = false;
    updateControlButtons();
}

// Update control buttons state
function updateControlButtons() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (isRunning) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

// Render targets list
function renderTargets() {
    const targetsList = document.getElementById('targetsList');
    
    if (targets.length === 0) {
        targetsList.innerHTML = '<p style="color: #999; font-size: 12px; text-align: center; padding: 20px;">Chưa có lớp nào được thêm</p>';
        return;
    }

    targetsList.innerHTML = targets.map((target, index) => `
        <div class="target-item">
            <div class="target-label">Lớp #${index + 1}</div>
            <div class="target-row">
                <div class="config-group">
                    <label>Tên Hiển Thị:</label>
                    <input type="text" value="${target.ten_goi_nho}" data-field="ten_goi_nho" data-index="${index}" class="target-field">
                </div>
                <div class="config-group">
                    <label>Mã Lớp:</label>
                    <input type="text" value="${target.ma_lop_hp}" data-field="ma_lop_hp" data-index="${index}" class="target-field" placeholder="(Để trống để tự động phát hiện)">
                </div>
            </div>
            <div class="target-row">
                <div class="config-group">
                    <label>Mã Môn:</label>
                    <input type="text" value="${target.ma_mon}" data-field="ma_mon" data-index="${index}" class="target-field">
                </div>
                <div class="config-group">
                    <label>Tên Môn Đầy Đủ:</label>
                    <input type="text" value="${target.ten_mon_full}" data-field="ten_mon_full" data-index="${index}" class="target-field">
                </div>
            </div>
            <button class="btn-remove" data-index="${index}" type="button">Xóa</button>
        </div>
    `).join('');

    // Add event listeners for target fields
    document.querySelectorAll('.target-field').forEach(field => {
        field.addEventListener('change', (e) => {
            const index = parseInt(e.target.dataset.index);
            const fieldName = e.target.dataset.field;
            targets[index][fieldName] = e.target.value;
            saveConfig();
        });
    });

    // Add event listeners for remove buttons
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            removeTarget(index);
        });
    });
}

// Remove target
function removeTarget(index) {
    targets.splice(index, 1);
    renderTargets();
    saveConfig();
}

// Add target
function addTarget() {
    targets.push({
        ten_goi_nho: "Lớp Mới",
        ma_lop_hp: "",
        ma_mon: "",
        ten_mon_full: ""
    });
    renderTargets();
    saveConfig();
}

// Save configuration to Chrome storage
function saveConfig() {
    const config = {
        cookie: document.getElementById('cookie').value,
        configId: document.getElementById('configId').value,
        schoolYear: document.getElementById('schoolYear').value,
        semester: document.getElementById('semester').value,
        delay: document.getElementById('delay').value,
        enableInterception: document.getElementById('enableInterception').checked,
        targets: targets
    };

    chrome.storage.sync.set({ 
        usshSniperConfig: config,
        enableInterception: config.enableInterception
    }, () => {
        log("💾 Cấu hình đã lưu", "info");
    });
}

// Load configuration from Chrome storage
function loadConfig() {
    chrome.storage.sync.get(['usshSniperConfig'], (result) => {
        if (result.usshSniperConfig) {
            const config = result.usshSniperConfig;
            document.getElementById('cookie').value = config.cookie || "";
            document.getElementById('configId').value = config.configId || "1686";
            document.getElementById('schoolYear').value = config.schoolYear || "2025 - 2026";
            document.getElementById('semester').value = config.semester || "2";
            document.getElementById('delay').value = config.delay || "1.0";
            document.getElementById('enableInterception').checked = config.enableInterception || false;
            targets = config.targets || [];
            renderTargets();
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Ensure elements exist
    const addTargetBtn = document.getElementById('addTarget');
    if (addTargetBtn) {
        addTargetBtn.addEventListener('click', addTarget);
        console.log('✓ Nút Thêm Lớp đã được gắn sự kiện');
    } else {
        console.error('✗ Nút Thêm Lớp không tìm thấy');
    }

    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            isRunning = true;
            updateControlButtons();
            huntingLoop();
        });
    }

    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            isRunning = false;
            updateControlButtons();
            log("⏹️ Đã dừng tool.", "info");
        });
    }

    const clearLogBtn = document.getElementById('clearLog');
    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => {
            logBuffer = [];
            updateLogDisplay();
        });
    }

    const saveConfigBtn = document.getElementById('saveConfig');
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', saveConfig);
    }

    // Auto-save on config changes
    ['cookie', 'configId', 'schoolYear', 'semester', 'delay', 'enableInterception'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            if (elem.type === 'checkbox') {
                elem.addEventListener('change', saveConfig);
            } else {
                elem.addEventListener('blur', saveConfig);
            }
        }
    });

    updateControlButtons();
    loadConfig();
});

// Event delegation for dynamically created elements
document.body.addEventListener('click', (e) => {
    if (e.target.id === 'addTarget') {
        e.preventDefault();
        e.stopPropagation();
        addTarget();
        return false;
    }
    
    if (e.target.classList.contains('btn-remove')) {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(e.target.dataset.index);
        removeTarget(index);
        return false;
    }
});
