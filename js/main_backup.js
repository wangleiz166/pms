// 项目管理系统 - 主JavaScript文件

// 全局变量
let currentUser = '王磊';
let selectedProjectData = null;

// 项目管理页面交互函数
function viewProjectPlan(projectId) {
    console.log(`查看项目 ${projectId} 的计划...`);
    
    // 跳转到独立的项目计划页面
    switchPage('project-plan');
    
    // 更新项目计划页面的标题
    const planTitle = document.getElementById('plan-project-title');
    if (planTitle) {
        // 根据projectId获取项目名称（这里使用模拟数据）
        const projectNames = {
            'P001': '企业级智能人事管理系统',
            'P002': '智慧园区安防监控平台', 
            'P003': '供应链金融服务系统',
            'proj-004': '大型电商平台后端重构'
        };
        const projectName = projectNames[projectId] || projectId;
        planTitle.textContent = `项目计划 - ${projectName}`;
    }
}

function showProjectList() {
    const projectListView = document.getElementById('project-list-view');
    const projectPlanView = document.getElementById('project-plan-view');

    if (projectListView && projectPlanView) {
        projectListView.style.display = 'block';
        projectPlanView.style.display = 'none';
    }
}

function showProjectForm(projectId) {
    console.log(`显示项目表单，项目ID: ${projectId}`);
    alert('项目表单功能正在开发中！');
}

function deleteProject(projectId) {
    console.log(`删除项目 ${projectId}`);
    if (confirm(`您确定要删除项目 ${projectId} 吗？`)) {
        alert('项目已删除（模拟）');
    }
}

function showTaskForm() {
    console.log('显示新增任务表单');
    alert('新增任务表单功能正在开发中！');
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    // 绑定登录表单事件
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 绑定表单提交事件
    bindFormEvents();

    // 绑定模态框事件
    bindModalEvents();

    // 默认显示工时填报页面
    switchPage('timesheet');

    // 显示欢迎信息
    setTimeout(() => {
        showNotification('欢迎使用项目管理系统！', 'info');
    }, 1000);
}

// 登录处理
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginText = document.getElementById('loginText');
    
    if (!username || !password) {
        showNotification('请输入用户名和密码', 'error');
        return;
    }
    
    // 模拟登录过程
    loginText.innerHTML = '<span class="loading"></span> 登录中...';
    
    setTimeout(() => {
        if (username === 'admin' || username === 'user' || username === '王磊' || username === 'wanglei') {
            currentUser = username;
            const userElement = document.getElementById('currentUser');
            if (userElement) {
                userElement.textContent = currentUser;
            }
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainApp').classList.add('active');
            showNotification('登录成功！', 'success');
        } else {
            showNotification('用户名或密码错误', 'error');
        }
        loginText.textContent = '登录';
    }, 1500);
}

// 登出功能
function logout() {
    if (confirm('确定要退出登录吗？')) {
        document.getElementById('mainApp').classList.remove('active');
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('loginForm').reset();
        showNotification('已退出登录', 'info');
    }
}



// 绑定表单事件
function bindFormEvents() {
    // 工时表单
    const timesheetForm = document.getElementById('timesheetForm');
    if (timesheetForm) {
        timesheetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!selectedProjectData) {
                showNotification('请选择项目', 'error');
                return;
            }
            
            showNotification('工时记录保存成功！', 'success');
            closeTimesheetModal();
        });
    }

    // 项目表单
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('项目创建成功！', 'success');
        });
    }

    // 合同表单
    const contractForm = document.getElementById('contractForm');
    if (contractForm) {
        contractForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('合同保存成功！', 'success');
        });
    }

    // 流水表单
    const flowForm = document.getElementById('flowForm');
    if (flowForm) {
        flowForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('流水记录保存成功！', 'success');
        });
    }
}

// 绑定模态框事件
function bindModalEvents() {
    const timesheetModal = document.getElementById('timesheetModal');
    if (timesheetModal) {
        timesheetModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeTimesheetModal();
            }
        });
    }
}

// 通知显示函数
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// 切换页面
function switchPage(pageId) {
    
    // 切换页面显示
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.style.display = 'none');
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.style.display = 'block';

        // 特殊页面处理
        if (pageId === 'project-management') {
            loadProjectManagementPage();
        } else if (pageId === 'contract-management') {
            // 初始化合同管理页面的筛选功能
            setTimeout(() => {
                initializeContractManagement();
            }, 100);
        } else if (pageId === 'ai-assistant') {
            // 初始化AI助手页面
            setTimeout(() => {
                initializeAIAssistant();
            }, 100);
        }
    }

    // 更新活动菜单项
    const menuItems = document.querySelectorAll('.nav-item');
    menuItems.forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`.nav-item[onclick="switchPage('${pageId}')"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// 动态加载项目管理页面
function loadProjectManagementPage() {
    const container = document.getElementById('project-managementPage');
    // 防止重复加载
    if (container.innerHTML.trim() === '<!-- 此处内容将通过JS动态加载 -->') {
        fetch('components/project_management.html')
            .then(response => response.text())
            .then(html => {
                container.innerHTML = html;
            })
            .catch(error => {
                container.innerHTML = '<p>项目管理模块加载失败，请稍后重试。</p>';
                console.error('Error loading project management page:', error);
            });
    }
}

// 系统管理标签页切换
function switchSystemTab(tabName) {
    const tabContents = document.querySelectorAll('#system-managementPage .tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    const tabBtns = document.querySelectorAll('#system-managementPage .tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    
    const targetContent = document.getElementById(`system-${tabName}`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    event.currentTarget.classList.add('active');
}

// 月份切换功能
function changeMonth(direction) {
    const monthElement = document.querySelector('.current-month');
    if (monthElement) {
        // 这里可以实现实际的月份切换逻辑
        showNotification(`${direction > 0 ? '下' : '上'}个月数据加载中...`, 'info');
    }
}

// 审核中心标签页切换
function switchApprovalTab(tabName) {
    // 移除所有标签页的active类
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // 激活当前标签页
    event.currentTarget.classList.add('active');
    const targetContent = document.getElementById(`${tabName}-approval`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

// 查看报工详情
function viewTimesheetDetail(timesheetId) {
    showNotification(`查看报工详情 ${timesheetId}`, 'info');
    // 这里可以实现查看详情的逻辑
}

// 通过报工审核
function approveTimesheet(timesheetId) {
    if (confirm('确定要通过这条报工记录吗？')) {
        showNotification(`报工 ${timesheetId} 已通过审核`, 'success');
        // 这里可以实现实际的审核通过逻辑
    }
}

// 驳回报工审核
function rejectTimesheet(timesheetId) {
    const reason = prompt('请输入驳回原因：');
    if (reason) {
        showNotification(`报工 ${timesheetId} 已驳回，原因：${reason}`, 'info');
        // 这里可以实现实际的审核驳回逻辑
    }
}

// 查看预算详情
function viewBudgetDetail(budgetId) {
    showNotification(`查看预算详情 ${budgetId}`, 'info');
    // 这里可以实现查看预算详情的逻辑
}

// 通过预算审核
function approveBudget(budgetId) {
    if (confirm('确定要通过这个预算申请吗？')) {
        showNotification(`预算申请 ${budgetId} 已通过审核`, 'success');
        // 这里可以实现实际的预算审核通过逻辑
    }
}

// 驳回预算审核
function rejectBudget(budgetId) {
    const reason = prompt('请输入驳回原因：');
    if (reason) {
        showNotification(`预算申请 ${budgetId} 已驳回，原因：${reason}`, 'info');
        // 这里可以实现实际的预算审核驳回逻辑
    }
}

// 显示新增任务表单
function showTaskForm() {
    showNotification('新增任务功能开发中...', 'info');
    // 这里可以实现新增任务表单的显示逻辑
    // 例如：显示模态框、跳转到任务创建页面等
}

// 合同管理筛选功能
function filterContracts() {
    const searchValue = document.getElementById('contractSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('contractStatusFilter')?.value || '';
    const clientFilter = document.getElementById('contractClientFilter')?.value || '';
    const startDate = document.getElementById('contractStartDate')?.value || '';
    const endDate = document.getElementById('contractEndDate')?.value || '';
    
    const tableRows = document.querySelectorAll('#contract-managementPage tbody tr');
    
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;
        
        const contractNumber = cells[0]?.textContent.toLowerCase() || '';
        const contractName = cells[1]?.textContent.toLowerCase() || '';
        const client = cells[2]?.textContent || '';
        const status = cells[6]?.textContent || '';
        const contractStartDate = cells[4]?.textContent || '';
        const contractEndDate = cells[5]?.textContent || '';
        
        let showRow = true;
        
        // 搜索框筛选
        if (searchValue && 
            !contractNumber.includes(searchValue) && 
            !contractName.includes(searchValue) && 
            !client.toLowerCase().includes(searchValue)) {
            showRow = false;
        }
        
        // 状态筛选
        if (statusFilter && status !== statusFilter) {
            showRow = false;
        }
        
        // 客户筛选
        if (clientFilter && client !== clientFilter) {
            showRow = false;
        }
        
        // 日期范围筛选
        if (startDate && contractStartDate < startDate) {
            showRow = false;
        }
        
        if (endDate && contractEndDate > endDate) {
            showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
    
    showNotification('筛选完成', 'success');
}

// 重置合同筛选
function resetContractFilters() {
    // 清空筛选控件
    const searchInput = document.getElementById('contractSearch');
    const statusSelect = document.getElementById('contractStatusFilter');
    const clientSelect = document.getElementById('contractClientFilter');
    const startDateInput = document.getElementById('contractStartDate');
    const endDateInput = document.getElementById('contractEndDate');
    
    if (searchInput) searchInput.value = '';
    if (statusSelect) statusSelect.value = '';
    if (clientSelect) clientSelect.value = '';
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    
    // 显示所有行
    const tableRows = document.querySelectorAll('#contract-managementPage tbody tr');
    tableRows.forEach(row => {
        row.style.display = '';
    });
    
    showNotification('筛选已重置', 'info');
}

// 初始化合同管理页面
function initializeContractManagement() {
    // 动态添加筛选控件到合同管理页面
    const contractPage = document.getElementById('contract-managementPage');
    if (!contractPage) return;
    
    const card = contractPage.querySelector('.card');
    if (!card) return;
    
    // 检查是否已经添加了筛选控件
    if (card.querySelector('.card-header')) return;
    
    // 创建筛选控件HTML
    const filterHTML = `
        <div class="card-header">
            <h3>合同列表</h3>
            <div class="filter-controls">
                <input type="text" class="form-control" placeholder="搜索合同编号/名称/客户" id="contractSearch">
                <select class="form-control" id="contractStatusFilter">
                    <option value="">所有状态</option>
                    <option value="进行中">进行中</option>
                    <option value="已完成">已完成</option>
                    <option value="已暂停">已暂停</option>
                    <option value="已终止">已终止</option>
                </select>
                <select class="form-control" id="contractClientFilter">
                    <option value="">所有客户</option>
                    <option value="银联数据">银联数据</option>
                    <option value="内部项目">内部项目</option>
                </select>
                <input type="date" class="form-control" placeholder="开始日期" id="contractStartDate">
                <input type="date" class="form-control" placeholder="结束日期" id="contractEndDate">
                <button class="btn btn-secondary" onclick="filterContracts()">筛选</button>
                <button class="btn btn-outline" onclick="resetContractFilters()">重置</button>
            </div>
        </div>
    `;
    
    // 在card-body之前插入筛选控件
    const cardBody = card.querySelector('.card-body');
    if (cardBody) {
        cardBody.insertAdjacentHTML('beforebegin', filterHTML);
    }
}

// 报表分析时间维度筛选功能
function switchTimeDimension(dimension) {
    // 更新按钮状态
    const tabs = document.querySelectorAll('.time-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = 'white';
        tab.style.color = '#333';
    });
    
    event.currentTarget.classList.add('active');
    event.currentTarget.style.background = '#4A90E2';
    event.currentTarget.style.color = 'white';
    
    // 显示/隐藏相应的时间选择器
    const timeSelector = document.getElementById('timeSelector');
    const customDateRange = document.getElementById('customDateRange');
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    
    if (dimension === 'custom') {
        timeSelector.style.display = 'none';
        customDateRange.style.display = 'flex';
    } else {
        timeSelector.style.display = 'flex';
        customDateRange.style.display = 'none';
        
        // 根据维度调整选择器
        if (dimension === 'year') {
            monthSelect.style.display = 'none';
        } else if (dimension === 'quarter') {
            monthSelect.style.display = 'none';
            // 可以添加季度选择器
        } else {
            monthSelect.style.display = 'block';
        }
    }
    
    showNotification(`已切换到${getDimensionName(dimension)}维度`, 'info');
}

function getDimensionName(dimension) {
    const names = {
        'month': '月度',
        'quarter': '季度', 
        'year': '年度',
        'custom': '自定义'
    };
    return names[dimension] || dimension;
}

// 应用时间筛选
function applyTimeFilter() {
    const activeTab = document.querySelector('.time-tab.active');
    if (!activeTab) return;
    
    const dimension = activeTab.onclick.toString().match(/'([^']+)'/)[1];
    let timeRange = '';
    
    if (dimension === 'custom') {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            showNotification('请选择开始和结束日期', 'error');
            return;
        }
        
        if (startDate > endDate) {
            showNotification('开始日期不能大于结束日期', 'error');
            return;
        }
        
        timeRange = `${startDate} 至 ${endDate}`;
    } else {
        const year = document.getElementById('yearSelect').value;
        const month = document.getElementById('monthSelect').value;
        
        if (dimension === 'year') {
            timeRange = `${year}年`;
        } else if (dimension === 'quarter') {
            const quarter = Math.ceil(month / 3);
            timeRange = `${year}年第${quarter}季度`;
        } else {
            timeRange = `${year}年${month}月`;
        }
    }
    
    // 更新报表标题显示时间范围
    updateReportTitles(timeRange);
    
    showNotification(`已应用时间筛选：${timeRange}`, 'success');
}

// 重置时间筛选
function resetTimeFilter() {
    // 重置为月度维度
    const monthTab = document.querySelector('[onclick*="month"]');
    if (monthTab) {
        monthTab.click();
    }
    
    // 重置日期选择
    document.getElementById('yearSelect').value = '2025';
    document.getElementById('monthSelect').value = '8';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    // 重置报表标题
    resetReportTitles();
    
    showNotification('时间筛选已重置', 'info');
}

// 更新报表标题
function updateReportTitles(timeRange) {
    const reportCards = document.querySelectorAll('#report-analysisPage .card-header h3');
    reportCards.forEach(title => {
        const originalText = title.textContent.split('(')[0]; // 移除之前的时间范围
        title.textContent = `${originalText}(${timeRange})`;
    });
}

// 重置报表标题
function resetReportTitles() {
    const reportCards = document.querySelectorAll('#report-analysisPage .card-header h3');
    const originalTitles = ['工时统计报表', '项目进度报表', '财务分析报表', '团队效率报表'];
    
    reportCards.forEach((title, index) => {
        if (originalTitles[index]) {
            title.textContent = originalTitles[index];
        }
    });
}

// AI助手对话功能
function handleAISearch() {
    const input = document.getElementById('aiSearchInput');
    const conversation = document.getElementById('aiConversation');
    const messagesContainer = document.getElementById('conversationMessages');
    
    if (!input || !input.value.trim()) {
        showNotification('请输入您的问题', 'error');
        return;
    }
    
    const question = input.value.trim();
    
    // 显示对话区域
    conversation.style.display = 'block';
    
    // 添加用户问题
    addMessage(messagesContainer, question, 'user');
    
    // 清空输入框
    input.value = '';
    
    // 显示加载状态
    addMessage(messagesContainer, 'AI正在思考中...', 'ai', true);
    
    // 模拟AI回复
    setTimeout(() => {
        // 移除加载状态
        const loadingMessage = messagesContainer.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
        
        // 添加AI回复
        const aiResponse = generateAIResponse(question);
        addMessage(messagesContainer, aiResponse, 'ai');
        
        showNotification('AI助手已回复', 'success');
    }, 2000);
}

// 添加消息到对话中
function addMessage(container, message, type, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message${isLoading ? ' loading-message' : ''}`;
    
    const messageStyle = type === 'user' 
        ? 'background: #4A90E2; color: white; margin-left: auto; max-width: 70%;'
        : 'background: #f0f0f0; color: #333; margin-right: auto; max-width: 70%;';
    
    messageDiv.style.cssText = `
        ${messageStyle}
        padding: 12px 16px;
        border-radius: 18px;
        margin-bottom: 12px;
        word-wrap: break-word;
        line-height: 1.4;
        ${isLoading ? 'opacity: 0.7;' : ''}
    `;
    
    if (type === 'ai' && !isLoading) {
        messageDiv.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 8px;">
                <div style="background: #4A90E2; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">🤖</div>
                <div>${message}</div>
            </div>
        `;
    } else {
        messageDiv.textContent = message;
    }
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// 生成AI回复
function generateAIResponse(question) {
    const responses = {
        '如何提高团队效率': '提高团队效率可以从以下几个方面入手：\n1. 明确团队目标和职责分工\n2. 建立高效的沟通机制\n3. 使用项目管理工具进行任务跟踪\n4. 定期进行团队回顾和改进\n5. 提供必要的培训和资源支持',
        '项目进度管理': '项目进度管理的最佳实践：\n1. 制定详细的项目计划和里程碑\n2. 使用甘特图进行进度可视化\n3. 定期进行进度检查和更新\n4. 及时识别和解决风险\n5. 保持与利益相关者的沟通',
        '成本控制': '项目成本控制的关键要素：\n1. 制定详细的项目预算\n2. 定期监控实际支出与预算的差异\n3. 建立成本审批流程\n4. 优化资源配置和使用\n5. 建立成本风险预警机制'
    };
    
    // 简单的关键词匹配
    for (const [key, response] of Object.entries(responses)) {
        if (question.includes(key) || question.includes(key.replace(/如何/, ''))) {
            return response;
        }
    }
    
    // 默认回复
    return `感谢您的问题：“${question}”\n\n作为项目管理智能助手，我建议您：\n1. 明确问题的具体背景和目标\n2. 分析当前面临的主要挑战\n3. 制定分步骤的解决方案\n4. 设立可衡量的成功指标\n\n如果您需要更具体的建议，请提供更多的上下文信息。`;
}

// 初始化AI助手页面
function initializeAIAssistant() {
    const aiInput = document.getElementById('aiSearchInput');
    if (aiInput) {
        // 绑定回车键事件
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleAISearch();
            }
        });
        
        // 焦点到输入框
        aiInput.focus();
    }
}

// 切换AI中心tab页面
function switchAITab(tabName) {
    // 隐藏所有tab内容
    const tabContents = document.querySelectorAll('.ai-tab-content');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // 移除所有tab的active状态
    const tabs = document.querySelectorAll('.ai-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.color = '#666';
        tab.style.borderBottomColor = 'transparent';
    });
    
    // 显示选中的tab内容
    const targetContent = document.getElementById(`ai-${tabName}-content`);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
    
    // 设置选中tab的active状态
    const activeTab = event.target;
    activeTab.classList.add('active');
    activeTab.style.color = '#4A90E2';
    activeTab.style.borderBottomColor = '#4A90E2';
    
    // 如果切换到智能助手tab，重新初始化输入框焦点
    if (tabName === 'assistant') {
        setTimeout(() => {
            const aiInput = document.getElementById('aiSearchInput');
            if (aiInput) {
                aiInput.focus();
            }
        }, 100);
    }
}

// 页面初始化
function initializePage() {
    // 默认显示工时管理页面
    switchPage('timesheet');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});
