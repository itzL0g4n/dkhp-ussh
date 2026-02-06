new Vue({
    el: '#app',
    data: {
        config: {
            cookie: '',
            config_id: '1686',
            nam_hoc: '2025 - 2026',
            hoc_ky: '2',
            delay: 1.0,
            targets: []
        },
        logs: [],
        isRunning: false,
        consoleScript: '// Đang tải...',
        pollingInterval: null
    },
    mounted() {
        this.fetchStatus();
        this.fetchConsoleScript();
        this.startLogPolling();
    },
    methods: {
        async fetchStatus() {
            try {
                const res = await axios.get('/api/status');
                if (res.data.config.targets) {
                    // Update state but try to preserve user edits if needed (simplified here)
                    this.config = res.data.config;
                    this.isRunning = res.data.is_running;
                }
            } catch (e) {
                console.error("Lỗi kết nối server", e);
            }
        },
        async fetchConsoleScript() {
            try {
                const res = await axios.get('/api/console-script');
                this.consoleScript = res.data.content;
            } catch (e) {
                this.consoleScript = '// Lỗi tải script';
            }
        },
        async startSniper() {
            try {
                await this.saveConfig(); // Save before starting
                const res = await axios.post('/api/start');
                if (res.data.is_running) {
                    this.isRunning = true;
                    this.logs.push({ timestamp: "-", message: ">>> GỬI LỆNH START...", type: "info" });
                } else {
                    alert("Không thể khởi động. Kiểm tra Logs.");
                }
            } catch (e) {
                alert("Lỗi: " + (e.response?.data?.message || e.message));
            }
        },
        async stopSniper() {
            try {
                await axios.post('/api/stop');
                this.isRunning = false;
                this.logs.push({ timestamp: "-", message: ">>> GỬI LỆNH STOP...", type: "warn" });
            } catch (e) {
                console.error(e);
            }
        },
        async saveConfig() {
            try {
                await axios.post('/api/config', this.config);
                // alert("Đã lưu cấu hình!");
            } catch (e) {
                alert("Lỗi lưu cấu hình: " + e.message);
            }
        },
        async fetchLogs() {
            try {
                const res = await axios.get('/api/logs');
                this.logs = res.data.logs;
                // Auto scroll to bottom
                this.$nextTick(() => {
                    const el = document.getElementById('logWindow');
                    if (el) el.scrollTop = el.scrollHeight;
                });
            } catch (e) {
                console.error(e);
            }
        },
        startLogPolling() {
            setInterval(() => {
                this.fetchLogs();
                // Also periodically check status to keep sync
                if (Math.random() > 0.8) this.fetchStatus();
            }, 1000);
        },
        addTarget() {
            this.config.targets.push({
                ten_goi_nho: '',
                ma_mon: '',
                ma_lop_hp: '',
                ten_mon_full: ''
            });
        },
        removeTarget(index) {
            this.config.targets.splice(index, 1);
        },
        copyScript() {
            navigator.clipboard.writeText(this.consoleScript);
            alert("Đã copy script vào bộ nhớ tạm!");
        }
    }
});
