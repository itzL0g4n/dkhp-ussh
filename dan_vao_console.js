(function() {
    console.clear();
    const STYLES = {
        title: "color: white; background: #d32f2f; font-size: 18px; font-weight: bold; padding: 5px 10px;",
        url: "color: #1976d2; font-weight: bold;",
        data: "color: #388e3c; font-weight: bold;"
    };

    console.log("%c🔥 ĐÃ KÍCH HOẠT CHẾ ĐỘ BẮT TẤT CẢ GÓI TIN", STYLES.title);
    
    // Hàm hiện thông báo góc màn hình
    function showToast(text) {
        let div = document.createElement("div");
        div.style.cssText = "position:fixed; bottom:20px; right:20px; background:red; color:white; padding:10px 20px; font-weight:bold; z-index:999999; border-radius:5px; box-shadow:0 0 10px rgba(0,0,0,0.5); font-family:sans-serif;";
        div.innerText = text;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 4000);
    }

    // Hàm giải mã body (Form Data hoặc JSON)
    function parseBody(body) {
        if (!body) return null;
        try {
            // Thử parse JSON
            return JSON.parse(body);
        } catch (e) {
            // Nếu không phải JSON, thử parse Form Data
            if (typeof body === 'string' && body.includes('=')) {
                const params = new URLSearchParams(body);
                const obj = {};
                let configId = null;
                for (const [key, value] of params.entries()) {
                    obj[key] = value;
                    if (key.includes('id') && key.includes('cauHinh')) configId = value;
                }
                return { _type: 'FORM_DATA', data: obj, configId };
            }
            return body; // Trả về nguyên gốc nếu không parse được
        }
    }

    // 1. BẮT FETCH
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const [resource, config] = args;
        const url = resource.toString();
        
        // Chỉ in ra nếu là link API của trường
        if (url.includes('hcmussh.edu.vn') && !url.includes('.js') && !url.includes('.css')) {
            console.group(`%c📡 FETCH: ${url}`, STYLES.url);
            
            if (config && config.body) {
                console.log("%c📤 PAYLOAD:", STYLES.data, parseBody(config.body));
                showToast("⚡ Bắt được 1 FETCH có Payload!");
            } else {
                console.log("Request không có body (có thể là GET)");
            }
            console.groupEnd();
        }
        return originalFetch(...args);
    };

    // 2. BẮT XHR (XMLHttpRequest) - QUAN TRỌNG
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        this._method = method;
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        // Chỉ in ra nếu là link API
        if (this._url.includes('api') || this._url.includes('hoc-phan') || this._url.includes('dang-ky')) {
            console.group(`%c📨 XHR: ${this._url}`, STYLES.url);
            
            if (body) {
                const parsed = parseBody(body);
                console.log("%c📤 PAYLOAD:", STYLES.data, parsed);
                
                if (parsed && parsed.configId) {
                    console.log(`%c🎯 PHÁT HIỆN CONFIG_ID: ${parsed.configId}`, "background:yellow; color:red; font-size:16px; font-weight:bold;");
                }
                showToast("⚡ Bắt được 1 XHR có Payload!");
            } else {
                console.log("Request không có body");
            }
            console.groupEnd();
        }
        return originalSend.apply(this, [body]);
    };

    // Mở khóa nút bấm
    setTimeout(() => {
        document.querySelectorAll('button, input').forEach(btn => {
            if (btn.disabled) {
                btn.removeAttribute('disabled');
                btn.style.border = "2px solid lime";
            }
        });
        console.log("🔓 Đã rà soát và mở khóa nút bấm.");
    }, 1500);

})();