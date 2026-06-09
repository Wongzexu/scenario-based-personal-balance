// public/js/cloud-sync.js

// 打开云空间弹窗
function CloudSpace() {
    openModal('cloud-modal');
}

const CloudSync = {
    // 测试连接
    async ifLinkCloud() {
        // 更新状态为加载中
        const msgEl = document.getElementById('cloud-status-message');
        const detailEl = document.getElementById('cloud-status-detail');
        const iconEl = document.getElementById('cloud-status-icon');
        
        if (msgEl) {
            msgEl.textContent = '正在测试连接...';
            msgEl.style.color = '#ff9800';
        }
        if (detailEl) detailEl.innerHTML = '请求后端服务';
        if (iconEl) iconEl.innerHTML = '🔄';
        
        try {
            // 测试后端连接
            const response = await fetch('/api/hello');
            const data = await response.json();
            
            // 显示成功
            if (msgEl) {
                msgEl.textContent = '连接成功！';
                msgEl.style.color = '#4caf50';
            }
            if (detailEl) detailEl.innerHTML = data.message;
            if (iconEl) iconEl.innerHTML = '✅';
            
            // 显示 Toast
            if (typeof showToast === 'function') {
                showToast('后端连接成功', 'success', 2000);
            }
            
        } catch (error) {
            // 显示失败
            if (msgEl) {
                msgEl.textContent = '连接失败';
                msgEl.style.color = '#f44336';
            }
            if (detailEl) detailEl.innerHTML = error.message;
            if (iconEl) iconEl.innerHTML = '❌';
            
            // 显示 Toast
            if (typeof showToast === 'function') {
                showToast('连接失败: ' + error.message, 'error', 3000);
            }
        }
    }
};