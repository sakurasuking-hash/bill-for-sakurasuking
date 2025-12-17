// ==================== 智能解析模块 ====================

class SmartParser {
    constructor() {
        this.paymentKeywords = {
            '支出': ['支付', '付款', '消费', '转账给', '支出', '购买', '扣款'],
            '收入': ['收款', '到账', '入账', '收入', '转账收款', '红包', '退款']
        };
        
        this.categoryKeywords = {
            '餐饮': ['餐', '饭', '外卖', '美团', '饿了么', '食', '咖啡', '奶茶', '肯德基', '麦当劳', '星巴克'],
            '交通': ['打车', '滴滴', '出租车', '地铁', '公交', '加油', '停车', '高速'],
            '购物': ['淘宝', '京东', '拼多多', '超市', '商场', '购物'],
            '娱乐': ['电影', '游戏', 'KTV', '网吧', '健身', '旅游'],
            '工资': ['工资', '薪资', '奖金', '提成']
        };
    }
    
    parse(text) {
        console.log('📋 开始解析文本:', text);
        
        const result = {
            success: false,
            amount: null,
            type: '支出',
            category: '其他',
            note: '',
            rawText: text
        };
        
        result.amount = this.extractAmount(text);
        
        if (!result.amount) {
            console.log('⚠️ 未找到金额');
            return result;
        }
        
        result.type = this.detectType(text);
        result.category = this.detectCategory(text, result.type);
        result.note = this.extractNote(text);
        result.success = true;
        
        console.log('✅ 解析成功:', result);
        return result;
    }
    
    extractAmount(text) {
        const patterns = [
            /[￥¥]\s*(\d+\.?\d*)/,
            /(\d+\.?\d*)\s*元/,
            /金额[:：]\s*(\d+\.?\d*)/,
            /共\s*(\d+\.?\d*)/,
            /\b(\d{1,6}\.\d{2})\b/,
            /\b(\d{1,6})\b/
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const amount = parseFloat(match[1]);
                if (amount >= 0.01 && amount <= 999999) {
                    console.log('💰 提取金额:', amount);
                    return amount;
                }
            }
        }
        
        return null;
    }
    
    detectType(text) {
        let expenseScore = 0;
        let incomeScore = 0;
        
        this.paymentKeywords['支出'].forEach(keyword => {
            if (text.includes(keyword)) expenseScore += 1;
        });
        
        this.paymentKeywords['收入'].forEach(keyword => {
            if (text.includes(keyword)) incomeScore += 1;
        });
        
        if (text.includes('成功') && text.includes('+')) {
            incomeScore += 2;
        }
        
        const type = incomeScore > expenseScore ? '收入' : '支出';
        console.log('📊 类型判断:', type);
        
        return type;
    }
    
    detectCategory(text, type) {
        let maxScore = 0;
        let detectedCategory = '其他';
        
        Object.keys(this.categoryKeywords).forEach(category => {
            let score = 0;
            this.categoryKeywords[category].forEach(keyword => {
                if (text.includes(keyword)) score += 1;
            });
            
            if (score > maxScore) {
                maxScore = score;
                detectedCategory = category;
            }
        });
        
        if (type === '收入' && detectedCategory === '其他') {
            if (text.includes('工资') || text.includes('薪资')) {
                detectedCategory = '工资';
            }
        }
        
        console.log('🏷️ 分类识别:', detectedCategory);
        return detectedCategory;
    }
    
    extractNote(text) {
        const quoteMatch = text.match(/["「『](.+?)["」』]/);
        if (quoteMatch) {
            return quoteMatch[1].substring(0, 30);
        }
        
        const targetMatch = text.match(/(?:向|给|来自|收到)\s*([^\s，。！]+)/);
        if (targetMatch) {
            return targetMatch[1].substring(0, 30);
        }
        
        const merchantMatch = text.match(/(?:商家|店铺|商户)[:：]\s*([^\s，。]+)/);
        if (merchantMatch) {
            return merchantMatch[1].substring(0, 30);
        }
        
        return text.substring(0, 20).replace(/[\n\r]/g, ' ');
    }
}

const smartParser = new SmartParser();
