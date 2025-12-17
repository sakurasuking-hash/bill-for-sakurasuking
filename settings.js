// ==================== 设置页功能 ====================

// 页面加载时初始化设置页
document.addEventListener('DOMContentLoaded', function() {
    // 延迟执行，确保 cloudSync 已加载
    setTimeout(initSettings, 100);
});

function initSettings() {
    // 更新同步状态显示
    updateSyncStatus();
    
    // 绑定设置页事件
    bindSettingsEvents();
}

// 更新同步状态显示
function updateSyncStatus() {
    const statusEl = document.getElementById('sync-status');
    if (!statusEl) return;
    
    if (cloudSync.syncEnabled) {
        statusEl.textContent = '✅ 已启用';
        statusEl.style.color = 'var(--income)';
    } else {
        statusEl.textContent = '❌ 未配置';
        statusEl.style.color = 'var(--text-secondary)';
    }
}

// 绑定设置页事件
function bindSettingsEvents() {
    // 保存 Token
    const saveTokenBtn = document.getElementById('save-token-btn');
    if (saveTokenBtn) {
        saveTokenBtn.addEventListener('click', saveToken);
    }
    
    // 手动同步
    const manualSyncBtn = document.getElementById('manual-sync-btn');
    if (manualSyncBtn) {
        manualSyncBtn.addEventListener('click', manualSync);
    }
    
    // 清除配置
    const clearConfigBtn = document.getElementById('clear-config-btn');
    if (clearConfigBtn) {
        clearConfigBtn.addEventListener('click', clearConfig);
    }
    
    // 导出数据
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // 清空数据
    const clearDataBtn = document.getElementById('clear-data-btn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }
}

// 保存 Token
function saveToken() {
    const token = document.getElementById('token-input').value.trim();
    
    if (!token) {
        alert('请输入 GitHub Token～');
        return;
    }
    
    cloudSync.setToken(token);
    updateSyncStatus();
    
    alert('配置已保存！✅\n现在会自动同步到云端啦～');
    
    // 清空输入框
    document.getElementById('token-input').value = '';
    
    // 立即执行一次同步
    manualSync();
}

// 手动同步
async function manualSync() {
    if (!cloudSync.syncEnabled) {
        alert('请先配置 GitHub Token～');
        return;
    }
    
    const btn = document.getElementById('manual-sync-btn');
    const originalText = btn.textContent;
    btn.textContent = '同步中...';
    btn.disabled = true;
    
    try {
        await cloudSync.autoSync();
        
        // 刷新列表
        if (typeof renderRecordList === 'function') {
            renderRecordList();
            updateMonthlySummary();
        }
        
        alert('同步成功！✅');
    } catch (error) {
        alert('同步失败：' + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// 清除配置
function clearConfig() {
    if (!confirm('确定要清除云端同步配置吗？\n（本地数据不会丢失）')) {
        return;
    }
    
    cloudSync.clearConfig();
    updateSyncStatus();
    alert('配置已清除～');
}

// 导出数据
function exportData() {
    const records = getRecordsFromStorage();
    const data = {
        records: records,
        exportTime: new Date().toISOString()
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `记账数据_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    alert('数据导出成功！✅');
}

// 清空所有数据
function clearAllData() {
    if (!confirm('⚠️ 确定要清空所有本地数据吗？\n此操作无法撤销！\n（云端数据不受影响）')) {
        return;
    }
    
    if (!confirm('再次确认：真的要清空吗？')) {
        return;
    }
    
    localStorage.removeItem('accounting_records');
    
    if (typeof renderRecordList === 'function') {
        renderRecordList();
        updateMonthlySummary();
    }
    
    alert('本地数据已清空～');
}
