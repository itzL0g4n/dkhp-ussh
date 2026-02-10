(function () {
    console.clear();

    const STYLES = {
        title: "font-size:14px; font-weight:bold;",
        label: "font-weight:bold;",
    };

    console.log("%cNetwork inspector enabled", STYLES.title);

    // Toast thông báo (nhẹ, trung tính)
    function showToast(text) {
        const div = document.createElement("div");
        div.style.cssText = `
            position: fixed;
            bottom: 16px;
            right: 16px;
            background: #333;
            color: #fff;
            padding: 8px 12px;
            font-size: 13px;
            z-index: 999999;
            border-radius: 4px;
            font-family: system-ui, sans-serif;
            opacity: 0.9;
        `;
        div.innerText = text;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    // Parse request body (JSON | form-urlencoded)
    function parseBody(body) {
        if (!body) return null;

        try {
            return JSON.parse(body);
        } catch {
            if (typeof body === "string" && body.includes("=")) {
                const params = new URLSearchParams(body);
                const data = {};
                let configId = null;

                for (const [k, v] of params.entries()) {
                    data[k] = v;
                    if (k.includes("cauHinh") && k.includes("id")) {
                        configId = v;
                    }
                }

                return { type: "form", data, configId };
            }
            return body;
        }
    }

    // FETCH interceptor
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const [resource, config] = args;
        const url = resource.toString();

        if (
            url.includes("hcmussh.edu.vn") &&
            !url.endsWith(".js") &&
            !url.endsWith(".css")
        ) {
            console.group(`FETCH ${url}`);

            if (config?.body) {
                console.log("%cPayload:", STYLES.label, parseBody(config.body));
                showToast("Fetch request captured");
            } else {
                console.log("No request body");
            }

            console.groupEnd();
        }

        return originalFetch(...args);
    };

    // XHR interceptor
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._method = method;
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        if (
            this._url.includes("api") ||
            this._url.includes("hoc-phan") ||
            this._url.includes("dang-ky")
        ) {
            console.group(`XHR ${this._method} ${this._url}`);

            if (body) {
                const parsed = parseBody(body);
                console.log("%cPayload:", STYLES.label, parsed);

                if (parsed?.configId) {
                    console.log("Detected configId:", parsed.configId);
                }

                showToast("XHR request captured");
            } else {
                console.log("No request body");
            }

            console.groupEnd();
        }

        return originalSend.apply(this, arguments);
    };

    // Enable disabled controls
    setTimeout(() => {
        document.querySelectorAll("button, input").forEach(el => {
            if (el.disabled) {
                el.disabled = false;
            }
        });
        console.log("Disabled controls checked");
    }, 1500);
})();
