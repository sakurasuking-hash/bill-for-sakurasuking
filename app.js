// ==================== 全局变量 ====================

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

let currentType = '支出';
let currentCategory = '餐饮';

// ==================== 模块 A：初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ 应用初始化中...');
    
    detectEnvironment();
    renderCategories();
    checkUrlParams();
    bindEvents();
    renderRecordList();
    updateMonthlySummary();
    
    if (typeof cloudSync !== 'undefined' && cloudSync.syncEnabled) {
        cloudSync.autoSync().then(() => {
            renderRecordList();
            updateMonthlySummary();
            console.log('☁️ 云端同步完成');
        });
    }
    
    // ⭐ 新增：初始化时也检测滚动
    checkPageScroll();
    
    console.log('✅ 应用初始化完成！');
});

// ==================== 模块 B：URL 参数处理 ====================

function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    // ⭐ 新增：优先处理快捷指令传来的原始文本
    const rawText = params.get('text');
    
    if (rawText) {
        console.log('📥 从 URL 读取原始文本:', rawText);
        
        const result = smartParser.parse(rawText);
        
        if (result.success) {
            console.log('✅ 解析成功:', result);
            autoFillForm(result);
            showToast('✅ 已自动识别金额和分类，请确认后保存～');
        } else {
            console.log('⚠️ 解析失败，无法提取有效信息');
        }
        
        return;
    }
    
    // 保留原有逻辑：支持单独传参
    const amount = params.get('amount');
    if (amount) {
        document.getElementById('amount-input').value = amount;
        console.log('📥 从URL读取金额:', amount);
    }
    
    const type = params.get('type');
    if (type && (type === '支出' || type === '收入')) {
        switchType(type);
        console.log('📥 从URL读取类型:', type);
    }
    
    const note = params.get('note');
    if (note) {
        document.getElementById('note-input').value = note;
        console.log('📥 从URL读取备注:', note);
    }
    
    const category = params.get('category');
    if (category) {
        currentCategory = category;
        highlightCategory(category);
        console.log('📥 从URL读取分类:', category);
    }
}

// ==================== 模块 C：分类渲染 ====================

function renderCategories() {
    const grid = document.getElementById('category-grid');
    grid.innerHTML = '';
    
    const categories = defaultCategories[currentType];
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.dataset.category = cat.name;
        
        if (cat.name === currentCategory) {
            btn.classList.add('active');
        }
        
        btn.innerHTML = `
            <span class="emoji">${cat.emoji}</span>
            <span class="label">${cat.name}</span>
        `;
        
        btn.addEventListener('click', () => {
            currentCategory = cat.name;
            highlightCategory(cat.name);
        });
        
        grid.appendChild(btn);
    });
}

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
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            switchType(type);
        });
    });
    
    document.getElementById('save-btn').addEventListener('click', saveRecord);
    
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
    
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });
    
    currentCategory = defaultCategories[type][0].name;
    renderCategories();
}

// ==================== 模块 F：页面切换 ====================

function switchPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById('page-' + pageName).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pageName) {
            btn.classList.add('active');
        }
    });
    
    const titles = {
        'add': '记一笔',
        'list': '账单',
        'settings': '设置'
    };
    document.getElementById('page-title').textContent = titles[pageName];
    
    if (pageName === 'list') {
        renderRecordList();
        updateMonthlySummary();
    }
    
    // ⭐ 新增：检测页面是否需要滚动，决定是否显示遮罩
    checkPageScroll();
}

// ⭐ 新增函数：检测内容是否超出
function checkPageScroll() {
    // 延迟执行，等待内容渲染完成
    setTimeout(() => {
        const appMain = document.querySelector('.app-main');
        
        // 判断内容高度是否超过容器高度
        if (appMain.scrollHeight > appMain.clientHeight) {
            // 有滚动条，显示提示遮罩
            document.querySelectorAll('.page.active').forEach(page => {
                page.classList.add('has-scroll');
            });
        } else {
            // 没有滚动条，隐藏遮罩
            document.querySelectorAll('.page.active').forEach(page => {
                page.classList.remove('has-scroll');
            });
        }
    }, 100);
}

// ==================== 模块 G：保存记录 ====================

function saveRecord() {
    const amount = parseFloat(document.getElementById('amount-input').value);
    const note = document.getElementById('note-input').value.trim();
    
    if (!amount || amount <= 0) {
        alert('请输入正确的金额～');
        return;
    }
    
    const record = {
        id: Date.now(),
        type: currentType,
        category: currentCategory,
        amount: amount,
        note: note,
        date: new Date().toISOString()
    };
    
    saveToStorage(record);
    alert('记账成功！✅');
    
    document.getElementById('amount-input').value = '';
    document.getElementById('note-input').value = '';
    
    switchPage('list');
    
    console.log('✅ 记录已保存:', record);
    
    if (typeof cloudSync !== 'undefined' && cloudSync.syncEnabled) {
        cloudSync.uploadData(getRecordsFromStorage(), getCustomCategories())
            .then(result => {
                if (result.success) {
                    console.log('☁️ 已同步到云端');
                }
            });
    }
}

// ==================== 模块 H：本地存储操作 ====================

function saveToStorage(record) {
    let records = getRecordsFromStorage();
    records.push(record);
    localStorage.setItem('accounting_records', JSON.stringify(records));
}

function getRecordsFromStorage() {
    const data = localStorage.getItem('accounting_records');
    return data ? JSON.parse(data) : [];
}

function deleteRecord(id) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }
    
    let records = getRecordsFromStorage();
    records = records.filter(r => r.id !== id);
    localStorage.setItem('accounting_records', JSON.stringify(records));
    
    renderRecordList();
    updateMonthlySummary();
    
    console.log('🗑️ 记录已删除:', id);
}

function getCustomCategories() {
    const data = localStorage.getItem('custom_categories');
    return data ? JSON.parse(data) : [];
}

// ==================== 模块 I：账单列表渲染 ====================

function renderRecordList() {
    const container = document.getElementById('record-list');
    const emptyState = document.getElementById('empty-state');
    const records = getRecordsFromStorage();
    
    if (records.length === 0) {
        container.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    const groupedRecords = groupByDate(records);
    
    container.innerHTML = '';
    
    Object.keys(groupedRecords).forEach(date => {
        const group = groupedRecords[date];
        
        const dayExpense = group.filter(r => r.type === '支出').reduce((sum, r) => sum + r.amount, 0);
        const dayIncome = group.filter(r => r.type === '收入').reduce((sum, r) => sum + r.amount, 0);
        
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
        
        group.forEach(record => {
            const item = createRecordItem(record);
            dateGroupDiv.appendChild(item);
        });
        
        container.appendChild(dateGroupDiv);
    });
}

function createRecordItem(record) {
    const div = document.createElement('div');
    div.className = 'record-item';
    
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

function groupByDate(records) {
    const grouped = {};
    
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    records.forEach(record => {
        const date = record.date.split('T')[0];
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(record);
    });
    
    return grouped;
}

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

function updateMonthlySummary() {
    const records = getRecordsFromStorage();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    const monthExpense = monthRecords.filter(r => r.type === '支出').reduce((sum, r) => sum + r.amount, 0);
    const monthIncome = monthRecords.filter(r => r.type === '收入').reduce((sum, r) => sum + r.amount, 0);
    
    document.getElementById('month-expense').textContent = `¥${monthExpense.toFixed(2)}`;
    document.getElementById('month-income').textContent = `¥${monthIncome.toFixed(2)}`;
}

// ==================== 模块 K：剪贴板处理 ====================



function autoFillForm(data) {
    if (data.type) {
        switchType(data.type);
    }
    
    if (data.amount) {
        document.getElementById('amount-input').value = data.amount;
    }
    
    if (data.category) {
        currentCategory = data.category;
        highlightCategory(data.category);
    }
    
    if (data.note) {
        document.getElementById('note-input').value = data.note;
    }
    
    document.getElementById('amount-input').focus();
    
    console.log('✅ 表单已自动填充:', data);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 注册 Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('✅ Service Worker 注册成功'))
        .catch(err => console.log('❌ Service Worker 注册失败:', err));
}

// ⭐ 新增：监听内容区域滚动
function initScrollListener() {
    const appMain = document.querySelector('.app-main');
    
    appMain.addEventListener('scroll', function() {
        const activePage = document.querySelector('.page.active');
        
        // 如果滚动超过 50px，认为用户在查看下方内容
        if (appMain.scrollTop > 50) {
            activePage.classList.add('is-scrolled');
        } else {
            activePage.classList.remove('is-scrolled');
        }
    });
}

// 在 DOMContentLoaded 中调用
document.addEventListener('DOMContentLoaded', function() {
    // ... 其他初始化代码
    
    initScrollListener();  // ⭐ 添加这一行
    
    console.log('✅ 应用初始化完成！');
});


console.log('📱 智能记账 APP - By 安然');
