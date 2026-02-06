document.addEventListener('DOMContentLoaded', async () => {
    // Load settings
    const keys = ['configId', 'namHoc', 'hocKy', 'targets', 'consoleEnabled', 'isRunning'];
    const result = await chrome.storage.local.get(keys);

    if (result.configId) document.getElementById('configId').value = result.configId;
    if (result.namHoc) document.getElementById('namHoc').value = result.namHoc;
    if (result.hocKy) document.getElementById('hocKy').value = result.hocKy;
    if (result.consoleEnabled) document.getElementById('chkConsole').checked = result.consoleEnabled;

    // Load Targets
    let targets = [];
    if (result.targets) {
        try {
            targets = JSON.parse(result.targets);
        } catch (e) { targets = []; }
    } else {
        // Default example
        targets = [
            {
                "ten_goi_nho": "Văn học VN",
                "ma_lop_hp": "2520VNH070L01",
                "ma_mon": "VNH070",
                "ten_mon_full": "Tổng quan văn học Việt Nam"
            }
        ];
    }

    renderTargets(targets);
    updateButtonState(result.isRunning);

    // ================= EVENTS =================
    document.getElementById('btnSave').addEventListener('click', () => saveConfig(getCurrentTargets()));
    document.getElementById('btnStart').addEventListener('click', startHunting);
    document.getElementById('btnStop').addEventListener('click', stopHunting);
    document.getElementById('chkConsole').addEventListener('change', toggleConsoleFeature);

    // Modal Events
    document.getElementById('btnAdd').addEventListener('click', showModal);
    document.getElementById('btnModalCancel').addEventListener('click', hideModal);
    document.getElementById('btnModalSave').addEventListener('click', () => addTargetFromModal(getCurrentTargets()));
});

// ================= RENDER LOGIC =================
function getCurrentTargets() {
    // Current state is stored in the DOM (simpler for this scale) or we can read from storage
    // But better to maintain a local variable 'targets' in a real app. 
    // Here we will read fresh from storage to be safe, but since we are editing...
    // Let's implement a global variable pattern for cleanliness in this file.
    return window.currentTargets || [];
}

function renderTargets(targets) {
    window.currentTargets = targets; // Keep state sync
    const container = document.getElementById('targetContainer');
    const emptyMsg = document.getElementById('emptyMsg');

    container.innerHTML = '';

    if (targets.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';

        targets.forEach((t, index) => {
            const card = document.createElement('div');
            card.style.cssText = "background: #f9f9f9; border: 1px solid #ddd; padding: 10px; margin-bottom: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;";

            const info = document.createElement('div');
            info.innerHTML = `
                <div style="font-weight: bold; color: #333;">${t.ten_goi_nho}</div>
                <div style="font-size: 11px; color: #666;">Mã Môn: <b>${t.ma_mon}</b></div>
                <div style="font-size: 11px; color: #666;">Lớp: ${t.ma_lop_hp || "<span style='color:green'>Tự động</span>"}</div>
            `;

            const btnDel = document.createElement('button');
            btnDel.innerText = "❌";
            btnDel.style.cssText = "width: 30px; height: 30px; padding: 0; background: transparent; color: red; border: 1px solid #ffcdd2; margin-top:0;";
            btnDel.onclick = () => {
                targets.splice(index, 1);
                renderTargets(targets); // re-render
                saveConfig(targets, false); // auto-save silent
            };

            card.appendChild(info);
            card.appendChild(btnDel);
            container.appendChild(card);
        });
    }
}

// ================= MODAL LOGIC =================
function showModal() {
    document.getElementById('inpName').value = '';
    document.getElementById('inpClassId').value = '';
    document.getElementById('inpSubjectId').value = '';
    document.getElementById('inpFullName').value = '';
    document.getElementById('modalOverlay').style.display = 'block';
}

function hideModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function addTargetFromModal(targets) {
    const name = document.getElementById('inpName').value.trim();
    const classId = document.getElementById('inpClassId').value.trim();
    const subjectId = document.getElementById('inpSubjectId').value.trim();
    const fullName = document.getElementById('inpFullName').value.trim();

    if (!name || !subjectId) {
        alert("Vui lòng nhập ít nhất [Tên gợi nhớ] và [Mã Môn]!");
        return;
    }

    const newTarget = {
        "ten_goi_nho": name,
        "ma_lop_hp": classId,
        "ma_mon": subjectId,
        "ten_mon_full": fullName || name
    };

    targets.push(newTarget);
    renderTargets(targets);
    saveConfig(targets, false);
    hideModal();
}

// ================= CORE LOGIC =================
function updateButtonState(isRunning) {
    const btnStart = document.getElementById('btnStart');
    const btnStop = document.getElementById('btnStop');
    const statusMsg = document.getElementById('statusMsg');

    if (isRunning) {
        btnStart.style.display = 'none';
        btnStop.style.display = 'block';
        statusMsg.innerText = "Đang chạy săn môn...";
        statusMsg.style.color = 'green';
    } else {
        btnStart.style.display = 'block';
        btnStop.style.display = 'none';
        statusMsg.innerText = "Đã dừng / Chờ lệnh.";
        statusMsg.style.color = '#666';
    }
}

async function saveConfig(targets, showAlert = true) {
    const config = {
        configId: document.getElementById('configId').value,
        namHoc: document.getElementById('namHoc').value,
        hocKy: document.getElementById('hocKy').value,
        targets: JSON.stringify(targets), // We still save as JSON string for compatibility
        consoleEnabled: document.getElementById('chkConsole').checked
    };

    await chrome.storage.local.set(config);

    if (showAlert) {
        const status = document.getElementById('statusMsg');
        status.innerText = "Đã lưu cấu hình!";
        setTimeout(() => status.innerText = "Ready.", 2000);
    }
}

async function startHunting() {
    const targets = getCurrentTargets();
    await saveConfig(targets, false);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (!tab.url.includes("hcmussh.edu.vn")) {
        alert("Hãy mở trang hcmussh.edu.vn để chạy tool!");
        return;
    }

    const config = await chrome.storage.local.get(['configId', 'namHoc', 'hocKy', 'targets']);

    chrome.tabs.sendMessage(tab.id, {
        action: "START",
        config: config
    }, (response) => {
        if (chrome.runtime.lastError) {
            alert("Lỗi: Không tìm thấy Content Script. Hãy F5 lại trang web trường!");
        } else {
            chrome.storage.local.set({ isRunning: true });
            updateButtonState(true);
        }
    });
}

function stopHunting() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "STOP" });
        }
    });
    chrome.storage.local.set({ isRunning: false });
    updateButtonState(false);
}

function toggleConsoleFeature() {
    const enabled = document.getElementById('chkConsole').checked;
    chrome.storage.local.set({ consoleEnabled: enabled });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "TOGGLE_CONSOLE",
                enabled: enabled
            });
        }
    });
}
