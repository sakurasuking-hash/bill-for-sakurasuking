// ==================== 全局变量 ====================

// 默认分类配置（主人可以在这里修改分类）
const defaultCategories = {
    '支出': [
        { name: '餐饮', emoji: '🍜' },
        { name: '交通', emoji: '🚗' },
        { name: '购物', emoji: '🛍️' },
        { name: '娱乐', emoji: '🎬' },
        { name: '其他', emoji: '📦' }
    ],
    '收入': [
        { name: '工资', emoji: '💰' },
        { name: '兼职', emoji: '💼' },
        { name: '理财', emoji: '📈' },
        { name: '红包', emoji: '🧧' },
        { name: '其他', emoji: '📦' }
    ]
};

// 当前选中的状态
let currentType = '支出'; // 当前收支类型
let currentCategory = '餐饮'; // 当前分类

// ==================== 模块 A：初始化 ====================

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ 应用初始化中...');
    
    // 初始化分类按钮
    renderCategories();
    
    // 检查 URL 参数（从快捷指令传来的数据）
    checkUrlParams();
    
    // 绑定事件监听
    bindEvents();
    
    // 渲染账单列表
    renderRecordList();
    
    // 更新月度汇总
    updateMonthlySummary();
    
    console.log('✅ 应用初始化完成！');
});

// ==================== 模块 B：URL 参数处理 ====================

// 功能：读取 URL 参数，自动填充表单
// 快捷指令会通过 URL 传递参数，例如：
// https://xxx.github.io?amount=128.5&type=支出&note=午饭
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    // 读取金额
    const amount = params.get('amount');
    if (amount) {
        document.getElementById('amount-input').value = amount;
        console.log('📥 从URL读取金额:', amount);
    }
    
    // 读取类型
    const type = params.get('type');
    if (type && (type === '支出' || type === '收入')) {
        switchType(type);
        console.log('📥 从URL读取类型:', type);
    }
    
    // 读取备注
    const note = params.get('note');
    if (note) {
        document.getElementById('note-input').value = note;
        console.log('📥 从URL读取备注:', note);
    }
    
    // 读取分类
    const category = params.get('category');
    if (category) {
        currentCategory = category;
        highlightCategory(category);
        console.log('📥 从URL读取分类:', category);
    }
}

// ==================== 模块 C：分类渲染 ====================

// 功能：根据当前类型渲染分类按钮
function renderCategories() {
    const grid = document.getElementById('category-grid');
    grid.innerHTML = ''; // 清空
    
    const categories = defaultCategories[currentType];
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.dataset.category = cat.name;
        
        // 如果是当前选中的分类，添加 active 类
        if (cat.name === currentCategory) {
            btn.classList.add('active');
        }
        
        btn.innerHTML = `
            <span class="emoji">${cat.emoji}</span>
            <span class="label">${cat.name}</span>
        `;
        
        // 点击事件
        btn.addEventListener('click', () => {
            currentCategory = cat.name;
            highlightCategory(cat.name);
        });
        
        grid.appendChild(btn);
    });
}

// 高亮当前选中的分类
function highlightCategory(categoryName) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === categoryName) {
            btn.classList.add('active');
        }
    });
}

// ==================== 模块 D：事件绑定 ====================

function bindEvents() {
    // 收入/支出切换按钮
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            switchType(type);
        });
    });
    
    // 保存按钮
    document.getElementById('save-btn').addEventListener('click', saveRecord);
    
    // 底部导航切换
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageName = btn.dataset.page;
            switchPage(pageName);
        });
    });
}

// ==================== 模块 E：收支类型切换 ====================

function switchType(type) {
    currentType = type;
    
    // 更新按钮状态
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });
    
    // 切换分类列表（支出和收入的分类不同）
    currentCategory = defaultCategories[type][0].name; // 默认选第一个
    renderCategories();
}

// ==================== 模块 F：页面切换 ====================

function switchPage(pageName) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    document.getElementById('page-' + pageName).classList.add('active');
    
    // 更新导航栏状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pageName) {
            btn.classList.add('active');
        }
    });
    
    // 更新标题
    const titles = {
        'add': '记一笔',
        'list': '账单'
    };
    document.getElementById('page-title').textContent = titles[pageName];
    
    // 如果切换到列表页，刷新数据
    if (pageName === 'list') {
        renderRecordList();
        updateMonthlySummary();
    }
}

// ==================== 模块 G：保存记录 ====================

function saveRecord() {
    // 获取表单数据
    const amount = parseFloat(document.getElementById('amount-input').value);
    const note = document.getElementById('note-input').value.trim();
    
    // 验证金额
    if (!amount || amount <= 0) {
        alert('请输入正确的金额～');
        return;
    }
    
    // 构建记录对象
    const record = {
        id: Date.now(), // 用时间戳作为唯一 ID
        type: currentType,
        category: currentCategory,
        amount: amount,
        note: note,
        date: new Date().toISOString() // ISO 格式时间
    };
    
    // 保存到本地存储
    saveToStorage(record);
    
    // 显示成功提示
    alert('记账成功！✅');
    
    // 清空表单
    document.getElementById('amount-input').value = '';
    document.getElementById('note-input').value = '';
    
    // 跳转到列表页
    switchPage('list');
    
    console.log('✅ 记录已保存:', record);
}

// ==================== 模块 H：本地存储操作 ====================

// 保存记录到 LocalStorage
function saveToStorage(record) {
    let records = getRecordsFromStorage();
    records.push(record);
    localStorage.setItem('accounting_records', JSON.stringify(records));
}

// 从 LocalStorage 读取所有记录
function getRecordsFromStorage() {
    const data = localStorage.getItem('accounting_records');
    return data ? JSON.parse(data) : [];
}

// 删除记录
function deleteRecord(id) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }
    
    let records = getRecordsFromStorage();
    records = records.filter(r => r.id !== id);
    localStorage.setItem('accounting_records', JSON.stringify(records));
    
    // 刷新列表
    renderRecordList();
    updateMonthlySummary();
    
    console.log('🗑️ 记录已删除:', id);
}

// ==================== 模块 I：账单列表渲染 ====================

function renderRecordList() {
    const container = document.getElementById('record-list');
    const emptyState = document.getElementById('empty-state');
    const records = getRecordsFromStorage();
    
    // 如果没有记录，显示空状态
    if (records.length === 0) {
        container.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    // 按日期分组
    const groupedRecords = groupByDate(records);
    
    // 渲染
    container.innerHTML = '';
    
    Object.keys(groupedRecords).forEach(date => {
        const group = groupedRecords[date];
        
        // 计算当天总支出/收入
        const dayExpense = group.filter(r => r.type === '支出').reduce((sum, r) => sum + r.amount, 0);
        const dayIncome = group.filter(r => r.type === '收入').reduce((sum, r) => sum + r.amount, 0);
        
        // 创建日期分组
        const dateGroupDiv = document.createElement('div');
        dateGroupDiv.className = 'date-group';
        
        dateGroupDiv.innerHTML = `
            <div class="date-header">
                <span>${formatDateLabel(date)}</span>
                <span class="date-total">
                    支出 ¥${dayExpense.toFixed(2)} | 收入 ¥${dayIncome.toFixed(2)}
                </span>
            </div>
        `;
        
        // 渲染当天的记录
        group.forEach(record => {
            const item = createRecordItem(record);
            dateGroupDiv.appendChild(item);
        });
        
        container.appendChild(dateGroupDiv);
    });
}

// 创建单条记录的 DOM 元素
function createRecordItem(record) {
    const div = document.createElement('div');
    div.className = 'record-item';
    
    // 获取分类 emoji
    const categoryData = defaultCategories[record.type].find(c => c.name === record.category);
    const emoji = categoryData ? categoryData.emoji : '📦';
    
    div.innerHTML = `
        <div class="record-icon">${emoji}</div>
        <div class="record-info">
            <div class="record-category">${record.category}</div>
            <div class="record-note">${record.note || '无备注'}</div>
        </div>
        <div class="record-amount ${record.type === '支出' ? 'expense' : 'income'}">
            ¥${record.amount.toFixed(2)}
        </div>
        <button class="record-delete" onclick="deleteRecord(${record.id})">🗑️</button>
    `;
    
    return div;
}

// ==================== 模块 J：数据分组与统计 ====================

// 按日期分组记录
function groupByDate(records) {
    const grouped = {};
    
    // 按日期倒序排序
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    records.forEach(record => {
        const date = record.date.split('T')[0]; // 提取日期部分 YYYY-MM-DD
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(record);
    });
    
    return grouped;
}

// 格式化日期标签
function formatDateLabel(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateOnly = date.toDateString();
    const todayOnly = today.toDateString();
    const yesterdayOnly = yesterday.toDateString();
    
    if (dateOnly === todayOnly) {
        return '今天';
    } else if (dateOnly === yesterdayOnly) {
        return '昨天';
    } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
}

// 更新月度汇总
function updateMonthlySummary() {
    const records = getRecordsFromStorage();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 筛选本月记录
    const monthRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    // 计算总支出和总收入
    const monthExpense = monthRecords.filter(r => r.type === '支出').reduce((sum, r) => sum + r.amount, 0);
    const monthIncome = monthRecords.filter(r => r.type === '收入').reduce((sum, r) => sum + r.amount, 0);
    
    // 更新界面
    document.getElementById('month-expense').textContent = `¥${monthExpense.toFixed(2)}`;
    document.getElementById('month-income').textContent = `¥${monthIncome.toFixed(2)}`;
}

// ==================== 结束 ====================

console.log('📱 智能记账 APP - By 安然');
