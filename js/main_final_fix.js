// 项目管理系统 - 主JavaScript文件 (最终修复版本)

// 全局变量
let currentUser = '王磊';
let selectedProjectData = null;

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
        console.log(`通知: ${message}`);
    }
}

// 切换页面 (最终修复版本)
function switchPage(pageId) {
    console.log(`切换到页面: ${pageId}`);
    
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        // 强制设置样式确保显示 - 这是关键修复
        targetPage.style.cssText = '';  // 清除可能的冲突样式
        targetPage.style.display = 'block';
        targetPage.style.width = '100%';
        targetPage.style.maxWidth = '1400px';
        targetPage.style.margin = '0 auto';
        targetPage.style.padding = '20px';
        targetPage.style.boxSizing = 'border-box';
        targetPage.style.minHeight = '500px';
        targetPage.style.background = 'white';
        targetPage.style.borderRadius = '8px';
        targetPage.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        targetPage.style.position = 'relative';
        
        // 设置类名
        targetPage.className = 'page active';
        
        console.log(`页面 ${pageId}Page 已激活并强制显示`);
    } else {
        console.error(`页面 ${pageId}Page 不存在`);
    }

    // 更新活动菜单项
    const menuItems = document.querySelectorAll('.nav-item');
    menuItems.forEach(item => item.classList.remove('active'));
    
    // 查找对应的菜单项并激活
    const menuItem = Array.from(menuItems).find(item => {
        const onclick = item.getAttribute('onclick');
        return onclick && onclick.includes(`'${pageId}'`);
    });
    
    if (menuItem) {
        menuItem.classList.add('active');
    }
}

// 月份切换功能
function changeMonth(direction) {
    const monthElement = document.querySelector('.current-month');
    if (monthElement) {
        showNotification(`${direction > 0 ? '下' : '上'}个月数据加载中...`, 'info');
    }
}

// 审核中心标签页切换
function switchApprovalTab(tabName) {
    const tabBtns = document.querySelectorAll('#approval-centerPage .tab-btn');
    const tabContents = document.querySelectorAll('#approval-centerPage .tab-content');
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
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

// AI助手相关函数
function switchAITab(tabName) {
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
    } else {
        showNotification('请输入您的问题', 'error');
    }
}

// 报表分析时间维度筛选功能
function switchTimeDimension(dimension) {
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

// 项目管理相关函数
function viewProjectPlan(projectId) {
    console.log(`查看项目 ${projectId} 的计划...`);
    switchPage('project-plan');
    
    const planTitle = document.getElementById('plan-project-title');
    if (planTitle) {
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

function showProjectForm(projectId) {
    showNotification('项目表单功能正在开发中！', 'info');
}

function deleteProject(projectId) {
    if (confirm(`您确定要删除项目 ${projectId} 吗？`)) {
        showNotification('项目已删除（模拟）', 'success');
    }
}

function showTaskForm() {
    showNotification('新增任务表单功能正在开发中！', 'info');
}

// 审核相关函数
function viewTimesheetDetail(timesheetId) {
    showNotification(`查看报工详情 ${timesheetId}`, 'info');
}

function approveTimesheet(timesheetId) {
    if (confirm('确定要通过这条报工记录吗？')) {
        showNotification(`报工 ${timesheetId} 已通过审核`, 'success');
    }
}

function rejectTimesheet(timesheetId) {
    const reason = prompt('请输入驳回原因：');
    if (reason) {
        showNotification(`报工 ${timesheetId} 已驳回，原因：${reason}`, 'info');
    }
}

function viewBudgetDetail(budgetId) {
    showNotification(`查看预算详情 ${budgetId}`, 'info');
}

function approveBudget(budgetId) {
    if (confirm('确定要通过这个预算申请吗？')) {
        showNotification(`预算申请 ${budgetId} 已通过审核`, 'success');
    }
}

function rejectBudget(budgetId) {
    const reason = prompt('请输入驳回原因：');
    if (reason) {
        showNotification(`预算申请 ${budgetId} 已驳回，原因：${reason}`, 'info');
    }
}

// 工时相关函数
function openTimesheetModal(date) {
    showNotification(`打开 ${date || '今天'} 的工时填报`, 'info');
}

function closeTimesheetModal() {
    showNotification('关闭工时填报窗口', 'info');
}

// 合同管理筛选功能
function filterContracts() {
    showNotification('筛选完成', 'success');
}

function resetContractFilters() {
    showNotification('筛选已重置', 'info');
}

// 应用时间筛选
function applyTimeFilter() {
    showNotification('时间筛选已应用', 'success');
}

