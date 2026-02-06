(function () {
    console.clear();
    const STYLES = {
        title: "color: white; background: #d32f2f; font-size: 18px; font-weight: bold; padding: 5px 10px;",
        url: "color: #1976d2; font-weight: bold;",
        data: "color: #388e3c; font-weight: bold;"
    };

    console.log("%c🔥 ĐÃ KÍCH HOẠT CHẾ ĐỘ BẮT TẤT CẢ GÓI TIN", STYLES.title);

    function showToastMain(text) {
        let div = document.createElement("div");
        div.style.cssText = "position:fixed; bottom:80px; right:20px; background:red; color:white; padding:10px 20px; font-weight:bold; z-index:999999; border-radius:5px; box-shadow:0 0 10px rgba(0,0,0,0.5); font-family:sans-serif;";
        div.innerText = text;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 4000);
    }

    function parseBody(body) {
        if (!body) return null;
        try {
            return JSON.parse(body);
        } catch (e) {
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
            return body;
        }
    }

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const [resource, config] = args;
        const url = resource.toString();
        // Ignore extension requests or non-api
        if (url.includes('hcmussh.edu.vn') && !url.includes('.js') && !url.includes('.css')) {
            console.group(`%c📡 FETCH: ${url}`, STYLES.url);
            if (config && config.body) {
                console.log("%c📤 PAYLOAD:", STYLES.data, parseBody(config.body));
                showToastMain("⚡ Bắt được 1 FETCH!");
            }
            console.groupEnd();
        }
        return originalFetch(...args);
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._url = url;
        this._method = method;
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        if (this._url && (this._url.includes('api') || this._url.includes('hoc-phan') || this._url.includes('dang-ky'))) {
            console.group(`%c📨 XHR: ${this._url}`, STYLES.url);
            if (body) {
                const parsed = parseBody(body);
                console.log("%c📤 PAYLOAD:", STYLES.data, parsed);
                if (parsed && parsed.configId) {
                    console.log(`%c🎯 PHÁT HIỆN CONFIG_ID: ${parsed.configId}`, "background:yellow; color:red; font-size:16px; font-weight:bold;");
                }
                showToastMain("⚡ Bắt được 1 XHR!");
            }
            console.groupEnd();
        }
        return originalSend.apply(this, [body]);
    };

    // Unlock buttons
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
