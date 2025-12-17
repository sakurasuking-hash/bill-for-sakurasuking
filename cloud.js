// ==================== GitHub Gist 云端同步模块 ====================

// 云端同步配置类
class CloudSync {
    constructor() {
        this.token = this.getToken();
        this.gistId = this.getGistId();
        this.syncEnabled = !!this.token;
    }
    
    // ==================== 配置管理 ====================
    
    // 获取 GitHub Token
    getToken() {
        return localStorage.getItem('github_token') || '';
    }
    
    // 设置 GitHub Token
    setToken(token) {
        localStorage.setItem('github_token', token);
        this.token = token;
        this.syncEnabled = !!token;
    }
    
    // 获取 Gist ID
    getGistId() {
        return localStorage.getItem('gist_id') || '';
    }
    
    // 设置 Gist ID
    setGistId(id) {
        localStorage.setItem('gist_id', id);
        this.gistId = id;
    }
    
    // 清除配置
    clearConfig() {
        localStorage.removeItem('github_token');
        localStorage.removeItem('gist_id');
        this.token = '';
        this.gistId = '';
        this.syncEnabled = false;
    }
    
    // ==================== 上传数据到云端 ====================
    
    async uploadData(records, categories) {
        if (!this.syncEnabled) {
            console.log('⚠️ 云端同步未启用');
            return { success: false, message: '请先配置 GitHub Token' };
        }
        
        try {
            const data = {
                records: records,
                categories: categories,
                lastSync: new Date().toISOString()
            };
            
            const content = JSON.stringify(data, null, 2);
            
            // 如果已有 Gist ID，更新；否则创建新的
            if (this.gistId) {
                return await this.updateGist(content);
            } else {
                return await this.createGist(content);
            }
        } catch (error) {
            console.error('❌ 上传失败:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 创建新的 Gist
    async createGist(content) {
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: '智能记账数据备份',
                public: false, // 私有
                files: {
                    'accounting-data.json': {
                        content: content
                    }
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`创建失败: ${response.status}`);
        }
        
        const result = await response.json();
        this.setGistId(result.id);
        
        console.log('✅ 创建 Gist 成功:', result.id);
        return { success: true, message: '上传成功', gistId: result.id };
    }
    
    // 更新已有的 Gist
    async updateGist(content) {
        const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: {
                    'accounting-data.json': {
                        content: content
                    }
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`更新失败: ${response.status}`);
        }
        
        console.log('✅ 更新 Gist 成功');
        return { success: true, message: '同步成功' };
    }
    
    // ==================== 从云端下载数据 ====================
    
    async downloadData() {
        if (!this.syncEnabled || !this.gistId) {
            console.log('⚠️ 无法下载：未配置或无 Gist ID');
            return { success: false, message: '请先配置云端同步' };
        }
        
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`下载失败: ${response.status}`);
            }
            
            const gist = await response.json();
            const content = gist.files['accounting-data.json'].content;
            const data = JSON.parse(content);
            
            console.log('✅ 下载数据成功');
            return { success: true, data: data };
        } catch (error) {
            console.error('❌ 下载失败:', error);
            return { success: false, message: error.message };
        }
    }
    
    // ==================== 自动同步 ====================
    
    async autoSync() {
        if (!this.syncEnabled) {
            return;
        }
        
        console.log('🔄 开始自动同步...');
        
        // 先下载云端数据
        const downloadResult = await this.downloadData();
        
        if (downloadResult.success && downloadResult.data) {
            // 合并本地和云端数据
            this.mergeData(downloadResult.data);
        }
        
        // 再上传本地数据
        const records = getRecordsFromStorage();
        const categories = getCustomCategories();
        await this.uploadData(records, categories);
    }
    
    // 合并本地和云端数据（防止冲突）
    mergeData(cloudData) {
        const localRecords = getRecordsFromStorage();
        const cloudRecords = cloudData.records || [];
        
        // 使用 Map 去重（优先保留更新的）
        const recordMap = new Map();
        
        // 先添加云端数据
        cloudRecords.forEach(r => {
            recordMap.set(r.id, r);
        });
        
        // 再添加本地数据（会覆盖相同 ID 的）
        localRecords.forEach(r => {
            recordMap.set(r.id, r);
        });
        
        // 保存合并后的数据
        const mergedRecords = Array.from(recordMap.values());
        localStorage.setItem('accounting_records', JSON.stringify(mergedRecords));
        
        console.log(`✅ 数据合并完成: 云端 ${cloudRecords.length} 条, 本地 ${localRecords.length} 条, 合并后 ${mergedRecords.length} 条`);
    }
}

// 创建全局实例
const cloudSync = new CloudSync();

// ==================== 辅助函数 ====================

// 获取自定义分类（预留功能）
function getCustomCategories() {
    const data = localStorage.getItem('custom_categories');
    return data ? JSON.parse(data) : [];
}
