// 项目管理系统 - 主JavaScript文件 (完全修复版本)

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
    showNotification('项目表单功能正在开发中！', 'info');
}

function deleteProject(projectId) {
    console.log(`删除项目 ${projectId}`);
    if (confirm(`您确定要删除项目 ${projectId} 吗？`)) {
        showNotification('项目已删除（模拟）', 'success');
    }
}

function showTaskForm() {
    console.log('显示新增任务表单');
    showNotification('新增任务表单功能正在开发中！', 'info');
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
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    } else {
        // 如果通知元素不存在，使用alert作为备选
        alert(message);
    }
}

// 切换页面 (完全修复版本)
function switchPage(pageId) {
    console.log(`切换到页面: ${pageId}`);
    
    // 移除所有页面的active类
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
        p.classList.remove('active');
        // 清除之前可能设置的style.display
        p.style.display = '';
    });
    
    // 给目标页面添加active类
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        
        // 强制设置样式确保显示
        targetPage.style.width = '100%';
        targetPage.style.minHeight = '500px';
        targetPage.style.display = 'block';
        
        console.log(`页面 ${pageId}Page 已激活`);
        
        // 特殊页面处理
        if (pageId === 'contract-management') {
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
    } else {
        console.error(`页面 ${pageId}Page 不存在`);
    }

    // 更新活动菜单项
    const menuItems = document.querySelectorAll('.nav-item');
    menuItems.forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`.nav-item[onclick="switchPage('${pageId}')"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
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
    const tabBtns = document.querySelectorAll('#approval-centerPage .tab-btn');
    const tabContents = document.querySelectorAll('#approval-centerPage .tab-content');
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // 激活当前标签页
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    const targetContent = document.getElementById(`${tabName}-approval`);
    if (targetContent) {
        targetContent.classList.add('active');
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
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// 查看报工详情
function viewTimesheetDetail(timesheetId) {
    showNotification(`查看报工详情 ${timesheetId}`, 'info');
}

// 通过报工审核
function approveTimesheet(timesheetId) {
    if (confirm('确定要通过这条报工记录吗？')) {
        showNotification(`报工 ${timesheetId} 已通过审核`, 'success');
    }
}

// 驳回报工审核
function rejectTimesheet(timesheetId) {
    const reason = prompt('请输入驳回原因：');
    if (reason) {
        showNotification(`报工 ${timesheetId} 已驳回，原因：${reason}`, 'info');
    }
}

// 查看预算详情
function viewBudgetDetail(budgetId) {
    showNotification(`查看预算详情 ${budgetId}`, 'info');
}

// 通过预算审核
function approveBudget(budgetId) {
    if (confirm('确定要通过这个预算申请吗？')) {
        showNotification(`预算申请 ${budgetId} 已通过审核`, 'success');
    }
}

// 驳回预算审核
function rejectBudget(budgetId) {
    const reason = prompt('请输入驳回原因：');
    if (reason) {
        showNotification(`预算申请 ${budgetId} 已驳回，原因：${reason}`, 'info');
    }
}

// 初始化合同管理页面
function initializeContractManagement() {
    console.log('初始化合同管理页面');
    // 这里可以添加合同管理页面的初始化逻辑
}

// 初始化AI助手页面
function initializeAIAssistant() {
    console.log('初始化AI助手页面');
    // 这里可以添加AI助手页面的初始化逻辑
}

// 工时相关函数
function openTimesheetModal(date) {
    showNotification(`打开 ${date || '今天'} 的工时填报`, 'info');
    // 这里可以添加实际的模态框显示逻辑
}

function closeTimesheetModal() {
    showNotification('关闭工时填报窗口', 'info');
    // 这里可以添加实际的模态框关闭逻辑
}

// AI助手相关函数
function switchAITab(tabName) {
    // 移除所有AI标签的active类
    const aiTabs = document.querySelectorAll('#ai-assistantPage .ai-tab');
    const aiContents = document.querySelectorAll('#ai-assistantPage .ai-tab-content');
    
    aiTabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.color = '#666';
        tab.style.borderBottomColor = 'transparent';
    });
    
    aiContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // 激活当前标签
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
        event.currentTarget.style.color = '#4A90E2';
        event.currentTarget.style.borderBottomColor = '#4A90E2';
    }
    
    const targetContent = document.getElementById(`ai-${tabName}-content`);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
}

function handleAISearch() {
    const input = document.getElementById('aiSearchInput');
    if (input && input.value.trim()) {
        showNotification(`AI正在处理您的问题: ${input.value}`, 'info');
        // 这里可以添加实际的AI处理逻辑
    } else {
        showNotification('请输入您的问题', 'error');
    }
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

// 报表分析时间维度筛选功能
function switchTimeDimension(dimension) {
    // 更新按钮状态
    const tabs = document.querySelectorAll('#report-analysisPage .time-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = 'white';
        tab.style.color = '#333';
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
        event.currentTarget.style.background = '#4A90E2';
        event.currentTarget.style.color = 'white';
    }
    
    // 显示/隐藏相应的时间选择器
    const timeSelector = document.getElementById('timeSelector');
    const customDateRange = document.getElementById('customDateRange');
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    
    if (dimension === 'custom') {
        if (timeSelector) timeSelector.style.display = 'none';
        if (customDateRange) customDateRange.style.display = 'flex';
    } else {
        if (timeSelector) timeSelector.style.display = 'flex';
        if (customDateRange) customDateRange.style.display = 'none';
        
        // 根据维度调整选择器
        if (dimension === 'year') {
            if (monthSelect) monthSelect.style.display = 'none';
        } else if (dimension === 'quarter') {
            if (monthSelect) monthSelect.style.display = 'none';
            // 可以添加季度选择器
        } else {
            if (monthSelect) monthSelect.style.display = 'block';
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
    const activeTab = document.querySelector('#report-analysisPage .time-tab.active');
    if (!activeTab) return;
    
    showNotification('时间筛选已应用', 'success');
    // 这里可以添加实际的筛选逻辑
}

