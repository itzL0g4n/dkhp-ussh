(function() {
    console.clear();
    const STYLES = {
        title: "background: #6f42c1; color: #fff; font-size: 16px; font-weight: bold; padding: 6px;",
        warn: "background: #ffeb3b; color: #000; font-weight: bold; padding: 4px;",
        key: "color: #0d6efd; font-weight: bold;",
        id: "color: #d63384; font-weight: bold; font-size: 18px;"
    };

    console.log("%c🚀 KÍCH HOẠT TOOL CRAWL DỮ LIỆU ĐA NĂNG", STYLES.title);

    // ============================================================
    // PHẦN 1: HÀM XỬ LÝ DỮ LIỆU CONFIG (JSON)
    // ============================================================
    function processConfigData(data) {
        if (data && data.items) {
            console.group("%c📦 ĐÃ TẢI ĐƯỢC DANH SÁCH ĐỢT ĐĂNG KÝ (CONFIG)", "color: green; font-size: 14px; font-weight: bold;");
            
            data.items.forEach((item, index) => {
                const isActive = item.active === 1 || item.kichHoat === 1;
                const statusIcon = isActive ? "🟢 ĐANG MỞ" : "🔴 CHƯA MỞ/ĐÃ ĐÓNG";
                
                console.groupCollapsed(`Đợt ${index + 1}: ${item.tenDot}`);
                console.log(`%c👉 CONFIG_ID: ${item.idDot}`, STYLES.id);
                console.log(`Trạng thái: ${statusIcon}`);
                console.log(`Năm học: ${item.namHoc} | Học kỳ: ${item.hocKy}`);
                console.log(`Thời gian bắt đầu: ${new Date(item.ngayBatDau).toLocaleString()}`);
                console.log("Raw Item:", item);
                console.groupEnd();
            });
            console.groupEnd();
            
            // Hiện thông báo toast
            showToast(`✅ Đã tìm thấy ${data.items.length} đợt đăng ký! Check Console.`);
        }
    }

    // ============================================================
    // PHẦN 2: CHỦ ĐỘNG LẤY CONFIG NGAY LẬP TỨC
    // ============================================================
    // Đây là phần giúp bạn thấy ID ngay cả khi chưa bấm gì
    console.log("%c⏳ Đang chủ động tải lại Config từ server...", "color: gray;");
    const timestamp = new Date().getTime();
    fetch(`https://hcmussh.edu.vn/api/dkmh/setting/config?t=${timestamp}`)
        .then(res => res.json())
        .then(data => processConfigData(data))
        .catch(err => console.log("Không tự tải được config:", err));


    // ============================================================
    // PHẦN 3: LẮNG NGHE CÁC REQUEST TƯƠNG LAI (KHI BẤM NÚT)
    // ============================================================
    
    // Hàm hiện thông báo góc màn hình
    function showToast(text) {
        let div = document.createElement("div");
        div.style.cssText = "position:fixed; bottom:20px; right:20px; background:#333; color:#fff; padding:12px 20px; font-weight:bold; z-index:999999; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.3); font-family:sans-serif; border-left: 5px solid #00ff00;";
        div.innerText = text;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 5000);
    }

    // Interceptor cho Fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const [resource, config] = args;
        const url = resource.toString();

        // Bắt POST (Đăng ký/Lobby)
        if (config && config.method === 'POST') {
             if (url.includes('get-data') || url.includes('dang-ky-hoc-phan')) {
                console.group(`%c🔥 BẮT ĐƯỢC REQUEST POST: ${url}`, STYLES.warn);
                
                // Parse Body
                let body = config.body;
                if (typeof body === 'string' && body.includes('=')) {
                    // Chuyển đổi Form Data sang JSON dễ nhìn
                    const params = new URLSearchParams(body);
                    const obj = {};
                    for (const [key, value] of params.entries()) obj[key] = value;
                    console.log("%cPAYLOAD (Copy cái này vào Tool):", STYLES.key, obj);
                } else {
                    console.log("%cPAYLOAD:", STYLES.key, body);
                }
                console.groupEnd();
                showToast("⚡ Bắt được Payload Đăng ký!");
             }
        }
        
        return originalFetch(...args);
    };

    // Interceptor cho XHR (Backup)
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        this._method = method;
        return originalOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
        if (this._method === 'POST' && (this._url.includes('api') || this._url.includes('hoc-phan'))) {
            console.group(`%c📨 BẮT ĐƯỢC XHR POST: ${this._url}`, STYLES.warn);
            console.log("%cPAYLOAD:", STYLES.key, body);
            console.groupEnd();
            showToast("⚡ Bắt được Payload XHR!");
        }
        return originalSend.apply(this, [body]);
    };

})();
