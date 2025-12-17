// ==================== 智能解析模块 ====================

class SmartParser {
    constructor() {
        // 支付关键词字典
        this.paymentKeywords = {
            '支出': ['支付', '付款', '消费', '转账给', '支出', '购买', '扣款'],
            '收入': ['收款', '到账', '入账', '收入', '转账收款', '红包', '退款']
        };
        
        // 分类关键词字典（可以由主人自己扩展）
        this.categoryKeywords = {
            '餐饮': ['餐', '饭', '外卖', '美团', '饿了么', '食', '咖啡', '奶茶', '肯德基', '麦当劳', '星巴克'],
            '交通': ['打车', '滴滴', '出租车', '地铁', '公交', '加油', '停车', '高速'],
            '购物': ['淘宝', '京东', '拼多多', '超市', '商场', '购物'],
            '娱乐': ['电影', '游戏', 'KTV', '网吧', '健身', '旅游'],
            '工资': ['工资', '薪资', '奖金', '提成']
        };
    }
    
    // ==================== 主解析函数 ====================
    
    /**
     * 从剪贴板文本中提取记账信息
     * @param {string} text - 剪贴板文本
     * @returns {object} 解析结果
     */
    parse(text) {
        console.log('📋 开始解析文本:', text);
        
        const result = {
            success: false,
            amount: null,
            type: '支出', // 默认支出
            category: '其他',
            note: '',
            rawText: text
        };
        
        // 1. 提取金额
        result.amount = this.extractAmount(text);
        
        if (!result.amount) {
            console.log('⚠️ 未找到金额');
            return result;
        }
        
        // 2. 判断收支类型
        result.type = this.detectType(text);
        
        // 3. 识别分类
        result.category = this.detectCategory(text, result.type);
        
        // 4. 提取备注信息
        result.note = this.extractNote(text);
        
        result.success = true;
        console.log('✅ 解析成功:', result);
        
        return result;
    }
    
    // ==================== 金额提取 ====================
    
    extractAmount(text) {
        // 正则匹配金额模式
        const patterns = [
            /[￥¥]\s*(\d+\.?\d*)/,           // ￥128.50
            /(\d+\.?\d*)\s*元/,              // 128.50元
            /金额[:：]\s*(\d+\.?\d*)/,       // 金额：128.50
            /共\s*(\d+\.?\d*)/,              // 共128.50
            /\b(\d{1,6}\.\d{2})\b/,          // 独立的金额数字 128.50
            /\b(\d{1,6})\b/                  // 纯数字（最后尝试）
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const amount = parseFloat(match[1]);
                // 金额合理性检查（0.01 ~ 999999）
                if (amount >= 0.01 && amount <= 999999) {
                    console.log('💰 提取金额:', amount);
                    return amount;
                }
            }
        }
        
        return null;
    }
    
    // ==================== 收支类型判断 ====================
    
    detectType(text) {
        let expenseScore = 0;
        let incomeScore = 0;
        
        // 计算关键词权重
        this.paymentKeywords['支出'].forEach(keyword => {
            if (text.includes(keyword)) {
                expenseScore += 1;
            }
        });
        
        this.paymentKeywords['收入'].forEach(keyword => {
            if (text.includes(keyword)) {
                incomeScore += 1;
            }
        });
        
        // 特殊规则：如果有"成功"且金额前有"+"，可能是收入
        if (text.includes('成功') && text.includes('+')) {
            incomeScore += 2;
        }
        
        const type = incomeScore > expenseScore ? '收入' : '支出';
        console.log('📊 类型判断:', type, `(支出分${expenseScore}, 收入分${incomeScore})`);
        
        return type;
    }
    
    // ==================== 分类识别 ====================
    
    detectCategory(text, type) {
        let maxScore = 0;
        let detectedCategory = '其他';
        
        // 遍历所有分类，计算匹配分数
        Object.keys(this.categoryKeywords).forEach(category => {
            let score = 0;
            this.categoryKeywords[category].forEach(keyword => {
                if (text.includes(keyword)) {
                    score += 1;
                }
            });
            
            if (score > maxScore) {
                maxScore = score;
                detectedCategory = category;
            }
        });
        
        // 如果是收入类型，优先判断是否为工资
        if (type === '收入' && detectedCategory === '其他') {
            if (text.includes('工资') || text.includes('薪资')) {
                detectedCategory = '工资';
            }
        }
        
        console.log('🏷️ 分类识别:', detectedCategory, `(匹配分${maxScore})`);
        
        return detectedCategory;
    }
    
    // ==================== 备注提取 ====================
    
    extractNote(text) {
        // 尝试提取商家名称或交易说明
        
        // 模式1：提取引号内的内容
        const quoteMatch = text.match(/["「『](.+?)["」』]/);
        if (quoteMatch) {
            return quoteMatch[1].substring(0, 30); // 限制长度
        }
        
        // 模式2：提取"向XXX"或"来自XXX"
        const targetMatch = text.match(/(?:向|给|来自|收到)\s*([^\s，。！]+)/);
        if (targetMatch) {
            return targetMatch[1].substring(0, 30);
        }
        
        // 模式3：提取商家名
        const merchantMatch = text.match(/(?:商家|店铺|商户)[:：]\s*([^\s，。]+)/);
        if (merchantMatch) {
            return merchantMatch[1].substring(0, 30);
        }
        
        // 默认：返回前20个字符作为备注
        return text.substring(0, 20).replace(/[\n\r]/g, ' ');
    }
    
    // ==================== AI 增强解析（预留接口）====================
    
    /**
     * 使用 AI API 进行智能解析（预留功能）
     * @param {string} text - 原始文本
     * @returns {Promise<object>} AI 解析结果
     */
    async parseWithAI(text) {
        // 这里主人以后可以接入 OpenAI / Claude / 通义千问 等 API
        
        try {
            // 示例：调用 AI API
            const apiKey = localStorage.getItem('ai_api_key');
            if (!apiKey) {
                console.log('⚠️ 未配置 AI API Key，使用本地解析');
                return this.parse(text);
            }
            
            // 构建 Prompt
            const prompt = `
请从以下文本中提取记账信息，返回 JSON 格式：
文本：${text}

要求：
1. amount: 金额（数字）
2. type: 收支类型（"收入"或"支出"）
3. category: 分类（餐饮/交通/购物/娱乐/工资/其他）
4. note: 备注（商家名或简短说明，不超过20字）

只返回 JSON，不要其他内容。
            `.trim();
            
            console.log('🤖 调用 AI 解析...');
            
            // 这里是 API 调用示例（需要主人后期配置）
            // const response = await fetch('AI_API_ENDPOINT', {
            //     method: 'POST',
            //     headers: {
            //         'Authorization': `Bearer ${apiKey}`,
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify({
            //         prompt: prompt,
            //         max_tokens: 100
            //     })
            // });
            
            // const aiResult = await response.json();
            // return aiResult;
            
            // 目前返回本地解析结果
            return this.parse(text);
            
        } catch (error) {
            console.error('❌ AI 解析失败:', error);
            // 降级到本地解析
            return this.parse(text);
        }
    }
}

// 创建全局实例
const smartParser = new SmartParser();
