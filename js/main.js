// 项目管理系统 - 完整版JavaScript

// 当前活跃页面
let currentPage = 'timesheet';
let currentUser = '王磊';

// 页面切换函数
async function switchPage(pageId) {
    console.log('Switching to page:', pageId);

    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });

    // 定义每个页面的初始化函数
    const pageInitializers = {
        'timesheet': () => {
            if (typeof initializeTimesheetPage === 'function') {
                initializeTimesheetPage();
            } else {
                console.error('initializeTimesheetPage function not found');
            }
        },
        'report-analysis': () => {
            if (typeof updateTableData === 'function') {
                updateTableData();
            }
        },
        'approval-center': () => {
            if (typeof fetchTimesheetApprovalData === 'function') {
                fetchTimesheetApprovalData();
            }
        },
        'project-management': () => {
            console.log('Project management page initializer called');
            if (typeof loadProjectList === 'function') {
                console.log('Calling loadProjectList function');
                loadProjectList();
            } else {
                console.error('loadProjectList function not found');
            }
        },
        'staff-management': () => {
            console.log('Staff management page initializer called');
            initializeStaffManagementPage();
        },
        'budget-management': () => {
            console.log('Budget management page initializer called');
            if (typeof initializeBudgetManagementPage === 'function') {
                initializeBudgetManagementPage();
            }
        },
        'team-management': () => {
            console.log('Team management page loaded');
            // 团队管理页面初始化逻辑
        },
        'financial-management': () => {
            console.log('Financial management page loaded');
            // 财务管理页面初始化逻辑
        },
        'business-management': () => {
            console.log('Business management page loaded');
            // 商务管理页面初始化逻辑
        },
        'task-scheduler': () => {
            console.log('Task scheduler page loaded');
            // 计划任务页面初始化逻辑
        },
        'system-management': () => {
            console.log('System management page loaded');
            // 系统管理页面初始化逻辑
        }
        // 其他页面可以继续在这里添加
    };

    const initializer = pageInitializers[pageId];
    console.log(`[switchPage] Initializer for '${pageId}':`, initializer ? 'Found' : 'No initializer found');

    if (window.componentLoader && typeof window.componentLoader.loadPage === 'function') {
        try {
            console.log(`[switchPage] Calling componentLoader.loadPage for '${pageId}'...`);
            await window.componentLoader.loadPage(pageId, '#pageContainer', 'replace', initializer);
            currentPage = pageId;
            console.log(`[switchPage] Successfully switched and initialized page '${pageId}'.`);
        } catch (error) {
            console.error(`[switchPage] Error loading page '${pageId}':`, error);
            showNotification(`加载页面失败: ${error.message}`, 'error');
        }
    } else {
        console.error('[switchPage] ComponentLoader or loadPage function is not available.');
        showNotification('页面加载器不可用', 'error');
    }
}

// 审核中心标签页切换
function switchApprovalTab(tabName, event) {
    const tabBtns = document.querySelectorAll('#approval-centerPage .tab-btn');
    const tabContents = document.querySelectorAll('#approval-centerPage .tab-content');

    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    const targetContent = document.getElementById(`${tabName}Tab`);
    if (targetContent) {
        targetContent.classList.add('active');
    }

    console.log('审核中心切换到:', tabName);

    // 切换标签页时加载对应数据
    if (tabName === 'timesheet') {
        fetchTimesheetApprovalData();
    } else if (tabName === 'budget') {
        fetchBudgetApprovalData();
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
    
    console.log('系统管理切换到:', tabName);
}

// 时间维度切换
function switchTimeDimension(dimension) {
    // 移除所有活动状态
    document.querySelectorAll('.time-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 隐藏所有选择器
    document.getElementById('timeSelector').style.display = 'none';
    document.getElementById('quarterSelector').style.display = 'none';
    document.getElementById('yearSelector').style.display = 'none';
    document.getElementById('customDateRange').style.display = 'none';
    
    // 激活选中的标签
    event.target.classList.add('active');
    
    // 显示对应的选择器
    switch(dimension) {
        case 'month':
            document.getElementById('timeSelector').style.display = 'flex';
            break;
        case 'quarter':
            document.getElementById('quarterSelector').style.display = 'flex';
            break;
        case 'year':
            document.getElementById('yearSelector').style.display = 'flex';
            break;
        case 'custom':
            document.getElementById('customDateRange').style.display = 'flex';
            break;
    }
}

// 合同管理相关函数
function viewContract(contractId) {
    console.log('查看合同:', contractId);
    showNotification(`查看合同 ${contractId} 详情`, 'info');
}

function editContract(contractId) {
    console.log('编辑合同:', contractId);
    showNotification(`编辑合同 ${contractId}`, 'info');
}

function deleteContract(contractId) {
    if (confirm(`确定要删除合同 ${contractId} 吗？`)) {
        console.log('删除合同:', contractId);
        showNotification(`合同 ${contractId} 已删除`, 'success');
    }
}

// 智效中心相关函数
function handleAISearch() {
    const input = document.getElementById('aiSearchInput');
    const conversation = document.getElementById('aiConversation');
    const messages = document.getElementById('conversationMessages');
    
    if (input && input.value.trim()) {
        // 显示对话区域
        if (conversation) {
            conversation.style.display = 'block';
        }
        
        // 添加用户消息
        if (messages) {
            const userMessage = document.createElement('div');
            userMessage.style.cssText = 'margin-bottom: 16px; padding: 12px 16px; border-radius: 12px; max-width: 80%; background: #667eea; color: white; margin-left: auto;';
            userMessage.textContent = input.value;
            messages.appendChild(userMessage);
            
            // 添加AI回复（模拟）
            setTimeout(() => {
                const aiMessage = document.createElement('div');
                aiMessage.style.cssText = 'margin-bottom: 16px; padding: 12px 16px; border-radius: 12px; max-width: 80%; background: white; border: 1px solid #e0e0e0; margin-right: auto;';
                aiMessage.textContent = '感谢您的问题！我正在分析您的项目管理需求，稍后会为您提供个性化的建议和解决方案。';
                messages.appendChild(aiMessage);
                
                // 滚动到底部
                messages.scrollTop = messages.scrollHeight;
            }, 1000);
            
            // 清空输入框
            input.value = '';
            
            // 滚动到底部
            setTimeout(() => {
                messages.scrollTop = messages.scrollHeight;
            }, 100);
        }
    }
}

function openFeature(feature) {
    const features = {
        'reports': '智能报表分析',
        'tasks': '定时任务管理', 
        'alerts': '异常报警系统',
        'coze': '扣子开发平台'
    };
    
    showNotification(`${features[feature]}功能正在开发中，敬请期待！`, 'info');
}

// 项目管理相关函数
function showProjectForm() {
    showNotification('新建项目功能正在开发中，敬请期待！', 'info');
}

function viewProjectPlan(projectId) {
    console.log(`查看项目 ${projectId} 的计划...`);
    showNotification(`查看项目 ${projectId} 计划`, 'info');
}

function viewProjectMembers(projectId) {
    console.log('查看项目人员:', projectId);
    showNotification(`查看项目 ${projectId} 人员`, 'info');
}

function editProject(projectId) {
    console.log('编辑项目:', projectId);
    showNotification(`编辑项目 ${projectId}`, 'info');
}

function deleteProject(projectId) {
    if (confirm(`确定要删除项目 ${projectId} 吗？`)) {
        console.log('删除项目:', projectId);
        showNotification(`项目 ${projectId} 已删除`, 'success');
    }
}

// 审核相关函数
function viewTimesheetDetail(timesheetId) {
    console.log('查看报工详情:', timesheetId);
    showNotification(`查看报工详情 ${timesheetId}`, 'info');
}

async function approveTimesheet(timesheetId) {
    try {
        const response = await fetch(`http://127.0.0.1:5001/api/reports/${timesheetId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
        showNotification(`报工记录 ${timesheetId} 已通过`, 'success');
            // 刷新报工审核列表
            refreshTimesheetApprovalList();
        } else {
            throw new Error('审核操作失败');
        }
    } catch (error) {
        console.error('审核报工失败:', error);
        showNotification('审核操作失败', 'error');
    }
}

async function rejectTimesheet(timesheetId) {
    // 第一次确认
    if (confirm('确定要驳回这条报工记录吗？')) {
        // 第二次确认
        if (confirm('请再次确认：驳回后该记录将无法恢复，确定要驳回吗？')) {
            try {
                const response = await fetch(`http://127.0.0.1:5001/api/reports/${timesheetId}/reject`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
        showNotification(`报工记录 ${timesheetId} 已驳回`, 'warning');
                    // 刷新报工审核列表
                    refreshTimesheetApprovalList();
                } else {
                    throw new Error('审核操作失败');
                }
            } catch (error) {
                console.error('驳回报工失败:', error);
                showNotification('审核操作失败', 'error');
            }
        }
    }
}

// 项目预算审核函数
function viewBudgetDetail(budgetId) {
    console.log('查看预算详情:', budgetId);
    showNotification(`查看预算详情 ${budgetId}`, 'info');
}

async function approveBudget(budgetId) {
    if (confirm('确定要通过这个项目预算吗？')) {
        try {
            const response = await fetch(`http://127.0.0.1:5001/api/budget/approve/${budgetId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                showNotification(`项目预算 ${budgetId} 已通过`, 'success');
                // 刷新预算审核列表
                refreshBudgetApprovalList();
            } else {
                throw new Error('审核操作失败');
            }
        } catch (error) {
            console.error('审核预算失败:', error);
            showNotification('审核操作失败', 'error');
        }
    }
}

async function rejectBudget(budgetId) {
    // 第一次确认
    if (confirm('确定要驳回这个项目预算吗？')) {
        // 第二次确认
        if (confirm('请再次确认：驳回后该预算将无法恢复，确定要驳回吗？')) {
            try {
                const response = await fetch(`http://127.0.0.1:5001/api/budget/reject/${budgetId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    showNotification(`项目预算 ${budgetId} 已驳回`, 'warning');
                    // 刷新预算审核列表
                    refreshBudgetApprovalList();
                } else {
                    throw new Error('审核操作失败');
                }
            } catch (error) {
                console.error('驳回预算失败:', error);
                showNotification('审核操作失败', 'error');
            }
        }
    }
}

// 刷新审核列表的函数
function refreshTimesheetApprovalList() {
    console.log('刷新报工审核列表');
    // 调用接口获取报工审核数据
    fetchTimesheetApprovalData(currentTimesheetPage);
}

// 当前报工审核页面
let currentTimesheetPage = 1;

// 分页相关函数
function changeTimesheetPage(direction) {
    if (direction === -1 && currentTimesheetPage > 1) {
        currentTimesheetPage--;
    } else if (direction === 1) {
        currentTimesheetPage++;
    } else if (typeof direction === 'number' && direction > 0) {
        currentTimesheetPage = direction;
    }
    
    fetchTimesheetApprovalData(currentTimesheetPage);
}

// 更新分页控件
function updateTimesheetApprovalPagination(pagination) {
    const infoElement = document.getElementById('timesheet-pagination-info');
    const pagesElement = document.getElementById('timesheet-pagination-pages');
    const prevBtn = document.getElementById('timesheet-prev-btn');
    const nextBtn = document.getElementById('timesheet-next-btn');
    
    if (!pagination) return;
    
    // 更新分页信息
    if (infoElement) {
        const start = (pagination.current_page - 1) * pagination.per_page + 1;
        const end = Math.min(pagination.current_page * pagination.per_page, pagination.total_count);
        infoElement.textContent = `显示第 ${start}-${end} 条，共 ${pagination.total_count} 条记录`;
    }
    
    // 更新页码按钮
    if (pagesElement) {
        pagesElement.innerHTML = '';
        const totalPages = pagination.total_pages;
        const currentPage = pagination.current_page;
        
        // 显示页码逻辑
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);
        
        // 如果总页数较少，显示所有页码
        if (totalPages <= 5) {
            startPage = 1;
            endPage = totalPages;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => changeTimesheetPage(i);
            pagesElement.appendChild(pageBtn);
        }
    }
    
    // 更新上一页/下一页按钮状态
    if (prevBtn) {
        prevBtn.disabled = pagination.current_page <= 1;
    }
    if (nextBtn) {
        nextBtn.disabled = pagination.current_page >= pagination.total_pages;
    }
}

function refreshBudgetApprovalList() {
    console.log('刷新预算审核列表');
    // 调用接口获取预算审核数据
    fetchBudgetApprovalData();
}

// 获取报工审核数据的函数
async function fetchTimesheetApprovalData(page = 1) {
    console.log('fetchTimesheetApprovalData 被调用，页码:', page);
    
    const tbody = document.getElementById('timesheet-approval-tbody');
    console.log('找到的 tbody 元素:', tbody);
    
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #999;">正在加载数据...</td></tr>';
    }
    
    try {
        const url = `http://127.0.0.1:5001/api/reports/pending?page=${page}&per_page=10`;
        console.log('请求URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log('响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('接收到的数据:', data);
            updateTimesheetApprovalTable(data.reports);
            updateTimesheetApprovalPagination(data.pagination);
            showNotification('报工审核列表已刷新', 'success');
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('获取报工审核数据失败:', error);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #f44336;">加载数据失败，请检查网络连接</td></tr>';
        }
        showNotification('获取报工审核数据失败', 'error');
    }
}

// 获取预算审核数据的函数
async function fetchBudgetApprovalData() {
    const tbody = document.getElementById('budget-approval-tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #999;">正在加载数据...</td></tr>';
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5001/api/budget/approval', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateBudgetApprovalTable(data);
            showNotification('预算审核列表已刷新', 'success');
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('获取预算审核数据失败:', error);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #f44336;">加载数据失败，请检查网络连接</td></tr>';
        }
        showNotification('获取预算审核数据失败', 'error');
    }
}

// 更新报工审核表格
function updateTimesheetApprovalTable(data) {
    const tbody = document.getElementById('timesheet-approval-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">暂无待审核的报工记录</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.employee_name}</td>
            <td>${item.project_name}</td>
            <td>${item.report_date}</td>
            <td>${item.hours_spent}</td>
            <td>${item.task_description}</td>
            <td><span class="status-badge status-pending">待审核</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="approveTimesheet('${item.id}')">通过</button>
                    <button class="action-btn delete-btn" onclick="rejectTimesheet('${item.id}')">驳回</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 更新预算审核表格
function updateBudgetApprovalTable(data) {
    const tbody = document.getElementById('budget-approval-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">暂无待审核的预算记录</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.project_name}</td>
            <td>${item.manager_name || item.manager}</td>
            <td><span class="budget-type ${item.type}">${item.type === 'initial' ? '初始预算' : item.type === 'adjustment' ? '预算调整' : '追加预算'}</span></td>
            <td>￥${item.amount.toLocaleString()}</td>
            <td>${item.submit_date}</td>
            <td><span>${item.status === 'pending' ? '待审核' : item.status === 'approved' ? '已通过' : '已驳回'}</span></td>
            <td>
                <div class="action-buttons">
                    ${item.status === 'pending' ? `
                        <button class="action-btn edit-btn" onclick="approveBudget('${item.id}')">通过</button>
                        <button class="action-btn delete-btn" onclick="rejectBudget('${item.id}')">驳回</button>
                    ` : `
                        <button class="action-btn view-btn" onclick="viewBudgetDetail('${item.id}')">查看</button>
                    `}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 人员管理相关函数
function editEmployee(employeeId) {
    console.log('编辑员工:', employeeId);
    showNotification(`编辑员工 ${employeeId}`, 'info');
}

function deleteEmployee(employeeId) {
    if (confirm(`确定要删除员工 ${employeeId} 吗？`)) {
        console.log('删除员工:', employeeId);
        showNotification(`员工 ${employeeId} 已删除`, 'success');
    }
}

// 通知函数
function showNotification(message, type = 'info') {
    console.log(`通知 [${type}]: ${message}`);
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// 初始化报表分析时间筛选器
function initReportTimeFilter() {
    // 设置默认显示月度选择器
    const timeSelector = document.getElementById('timeSelector');
    if (timeSelector) {
        timeSelector.style.display = 'flex';
    }
    
    // 设置当前年月
    const currentDate = new Date();
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    if (yearSelect) yearSelect.value = currentDate.getFullYear();
    if (monthSelect) monthSelect.value = currentDate.getMonth() + 1;
    
    console.log('报表分析时间筛选器初始化完成');
}

// 初始化主应用
function initializeMainApp() {
    console.log('初始化主应用...');
    
    // 默认显示工时管理页面
    switchPage('timesheet');
    
    // 为智效中心搜索框添加回车键监听
    const aiSearchInput = document.getElementById('aiSearchInput');
    if (aiSearchInput) {
        aiSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleAISearch();
            }
        });
    }
    
    // 初始化报表分析时间筛选器
    initReportTimeFilter();
    
    console.log('主应用初始化完成');
    
    // 加载工时数据
    if (typeof fetchAndDisplayReports === 'function') {
        fetchAndDisplayReports();
    }

    // 加载报工模态框所需的基础数据
    if (typeof loadEmployees === 'function') {
        loadEmployees();
    }
    if (typeof loadProjects === 'function') {
        loadProjects();
    }
    
    // 加载月度统计数据
    if (typeof loadMonthlyStats === 'function') {
        loadMonthlyStats();
    }
}


// 导出函数供HTML调用
// 显示登录页面
function showLogin() {
    // 隐藏主应用
    document.getElementById('mainApp').style.display = 'none';

    // 加载并显示登录页面
    window.componentLoader.loadPage('login', '#pageContainer', 'replace')
        .then(() => {
            const loginPage = document.getElementById('loginPage');
            if (loginPage) {
                loginPage.style.display = 'flex';
            }
        })
        .catch(error => {
            console.error('Failed to load login page:', error);
            if (typeof showErrorState === 'function') {
                showErrorState('登录页面加载失败');
            }
        });
}

// 登录成功后的处理
function onLoginSuccess() {
    // 隐藏登录页面
    const loginPage = document.getElementById('loginPage');
    if (loginPage) {
        loginPage.style.display = 'none';
    }

    // 显示主应用
    document.getElementById('mainApp').style.display = 'block';

    // 切换到默认页面
    switchPage('timesheet');
}

// 导出函数供HTML调用
window.switchPage = switchPage;
window.switchApprovalTab = switchApprovalTab;
window.switchSystemTab = switchSystemTab;
window.initializeMainApp = initializeMainApp;
window.switchTimeDimension = switchTimeDimension;
window.showLogin = showLogin;
window.onLoginSuccess = onLoginSuccess;

// 应用时间筛选
function applyTimeFilter() {
    const activeTab = document.querySelector('.time-tab.active');
    if (!activeTab) return;
    
    const dimension = activeTab.textContent.trim();
    let filterInfo = '';
    
    switch(dimension) {
        case '月度':
            const year = document.getElementById('yearSelect').value;
            const month = document.getElementById('monthSelect').value;
            filterInfo = `${year}年${month}月`;
            break;
        case '季度':
            const quarterYear = document.getElementById('quarterYearSelect').value;
            const quarter = document.getElementById('quarterSelect').value;
            filterInfo = `${quarterYear}年第${quarter}季度`;
            break;
        case '年度':
            const yearYear = document.getElementById('yearYearSelect').value;
            filterInfo = `${yearYear}年`;
            break;
        case '自定义':
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            if (startDate && endDate) {
                filterInfo = `${startDate} 至 ${endDate}`;
            } else {
                showNotification('请选择开始和结束日期', 'warning');
                return;
            }
            break;
    }
    
    showNotification(`已应用${dimension}筛选: ${filterInfo}`, 'success');
    
    // 这里可以添加实际的数据筛选逻辑
    // 模拟数据加载
    setTimeout(() => {
        updateTableData();
    }, 500);
}

// 重置时间筛选
function resetTimeFilter() {
    // 重置选择器
    document.getElementById('yearSelect').value = '2025';
    document.getElementById('monthSelect').value = '8';
    document.getElementById('quarterYearSelect').value = '2025';
    document.getElementById('quarterSelect').value = '3';
    document.getElementById('yearYearSelect').value = '2025';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    // 重置到月度视图
    switchTimeDimension('month');
    
    showNotification('筛选条件已重置', 'info');
    
    // 重新加载数据
    updateTableData();
}

// 更新表格数据
function updateTableData() {
    // 获取当前选中的时间维度
    const activeTab = document.querySelector('.time-tab.active');
    if (!activeTab) return;
    
    const dimension = activeTab.textContent.trim();
    let timeRange = 'current_month';
    
    // 根据时间维度设置API参数
    switch(dimension) {
        case '月度':
            timeRange = 'current_month';
            break;
        case '季度':
            timeRange = 'last_3_months';
            break;
        case '年度':
            timeRange = 'current_year';
            break;
        case '自定义':
            timeRange = 'custom';
            break;
    }
    
    // 调用API获取数据
    loadReportAnalysisData(timeRange);
    loadChartData();
}

// 加载报表分析数据
async function loadReportAnalysisData(timeRange) {
    try {
        const response = await fetch(`http://127.0.0.1:5001/api/reports/analysis?time_range=${timeRange}&page=1&per_page=10`);
        if (response.ok) {
            const data = await response.json();
            updateKPICards(data.kpi);
            updateAnalysisTable(data.reports);
            updatePagination(data.pagination);
        } else {
            console.error('获取报表数据失败:', response.status);
            showNotification('获取数据失败', 'error');
        }
    } catch (error) {
        console.error('API调用错误:', error);
        showNotification('网络错误', 'error');
    }
}

// 加载图表数据
async function loadChartData() {
    try {
        // 并行加载所有图表数据
        const [hoursTrend, projectProgress, teamEfficiency, financialAnalysis] = await Promise.all([
            fetch('http://127.0.0.1:5001/api/charts/hours-trend').then(r => r.json()),
            fetch('http://127.0.0.1:5001/api/charts/project-progress').then(r => r.json()),
            fetch('http://127.0.0.1:5001/api/charts/team-efficiency').then(r => r.json()),
            fetch('http://127.0.0.1:5001/api/charts/financial-analysis').then(r => r.json())
        ]);
        
        // 更新图表（这里可以集成图表库如Chart.js或ECharts）
        updateChartPlaceholders(hoursTrend, projectProgress, teamEfficiency, financialAnalysis);
        
    } catch (error) {
        console.error('获取图表数据失败:', error);
        showNotification('图表数据加载失败', 'error');
    }
}

// 更新KPI卡片
function updateKPICards(kpiData) {
    if (!kpiData) return;
    
    // 更新KPI卡片数据
    const kpiCards = document.querySelectorAll('.kpi-card');
    if (kpiCards.length > 0) {
        // 如果存在KPI卡片，更新它们
        kpiCards.forEach(card => {
            const metric = card.querySelector('.metric-value');
            const label = card.querySelector('.metric-label');
            if (metric && label) {
                switch(label.textContent.trim()) {
                    case '总工时':
                        metric.textContent = `${kpiData.total_hours.toFixed(1)}小时`;
                        break;
                    case '总人天':
                        metric.textContent = `${kpiData.total_days.toFixed(1)}人天`;
                        break;
                    case '日均工时':
                        metric.textContent = `${kpiData.avg_hours_per_day.toFixed(1)}小时/天`;
                        break;
                    case '填报率':
                        metric.textContent = `${kpiData.fill_rate.toFixed(1)}%`;
                        break;
                }
            }
        });
    }
}

// 更新分析表格
function updateAnalysisTable(reports) {
    const tbody = document.querySelector('#timesheetAnalysisTable tbody');
    if (!tbody || !reports) return;
    
    // 清空现有数据
    tbody.innerHTML = '';
    
    // 添加新数据
    reports.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.report_date}</td>
            <td>${report.employee_name}</td>
            <td>${report.project_name}</td>
            <td>${report.hours_spent}</td>
            <td>${(report.hours_spent / 8).toFixed(1)}</td>
            <td>${report.task_description}</td>
            <td><span class="status-badge ${getStatusClass(report.status)}">${getStatusText(report.status)}</span></td>
            <td>${formatDateTime(report.created_at)}</td>
        `;
        tbody.appendChild(row);
    });
}

// 更新分页信息
function updatePagination(pagination) {
    if (!pagination) return;
    
    const paginationInfo = document.querySelector('.pagination-info');
    if (paginationInfo) {
        const startRecord = (pagination.current_page - 1) * pagination.per_page + 1;
        const endRecord = Math.min(pagination.current_page * pagination.per_page, pagination.total_count);
        paginationInfo.textContent = `显示 ${startRecord}-${endRecord} 条，共 ${pagination.total_count} 条记录`;
    }
    
    // 更新分页按钮状态
    const prevBtn = document.querySelector('.pagination-controls button:nth-child(2)');
    const nextBtn = document.querySelector('.pagination-controls button:nth-child(7)');
    
    if (prevBtn) prevBtn.disabled = !pagination.has_prev;
    if (nextBtn) nextBtn.disabled = !pagination.has_next;
}

// 更新图表占位符
function updateChartPlaceholders(hoursTrend, projectProgress, teamEfficiency, financialAnalysis) {
    // 这里可以集成实际的图表库
    // 目前显示数据摘要
    console.log('工时趋势数据:', hoursTrend);
    console.log('项目进度数据:', projectProgress);
    console.log('团队效率数据:', teamEfficiency);
    console.log('财务分析数据:', financialAnalysis);
    
    // 可以在图表占位符中显示数据摘要
    const chartPlaceholders = document.querySelectorAll('.chart-placeholder');
    chartPlaceholders.forEach((placeholder, index) => {
        const info = placeholder.querySelector('.chart-info');
        if (info) {
            switch(index) {
                case 0: // 工时统计报表
                    if (hoursTrend && hoursTrend.hours.length > 0) {
                        const totalHours = hoursTrend.hours.reduce((sum, h) => sum + h, 0);
                        info.innerHTML = `<p>最近6个月总工时: ${totalHours.toFixed(1)}小时</p>`;
                    }
                    break;
                case 1: // 项目进度报表
                    if (projectProgress && projectProgress.length > 0) {
                        const activeProjects = projectProgress.filter(p => p.status === 'Active').length;
                        info.innerHTML = `<p>进行中项目: ${activeProjects}个</p>`;
                    }
                    break;
                case 2: // 财务分析报表
                    if (financialAnalysis && financialAnalysis.revenue.length > 0) {
                        const totalRevenue = financialAnalysis.revenue.reduce((sum, r) => sum + r, 0);
                        info.innerHTML = `<p>总收入: ¥${totalRevenue.toLocaleString()}</p>`;
                    }
                    break;
                case 3: // 团队效率报表
                    if (teamEfficiency && teamEfficiency.length > 0) {
                        const topPerformer = teamEfficiency.reduce((max, emp) => 
                            emp.efficiency_score > max.efficiency_score ? emp : max
                        );
                        info.innerHTML = `<p>最佳表现者: ${topPerformer.employee_name}</p>`;
                    }
                    break;
            }
        }
    });
}

// 获取状态样式类
function getStatusClass(status) {
    switch(status) {
        case 0: return 'pending';
        case 1: return 'approved';
        case 2: return 'rejected';
        default: return 'pending';
    }
}

// 获取状态文本
function getStatusText(status) {
    switch(status) {
        case 0: return '待审核';
        case 1: return '已通过';
        case 2: return '已驳回';
        default: return '待审核';
    }
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 分页切换
function changeAnalysisPage(page) {
    // 移除所有活动状态
    document.querySelectorAll('.page-number').forEach(num => {
        num.classList.remove('active');
    });
    
    // 激活选中的页码
    event.target.classList.add('active');
    
    // 更新分页信息
    const startRecord = (page - 1) * 10 + 1;
    const endRecord = Math.min(page * 10, 45);
    document.querySelector('.pagination-info').textContent = `显示 ${startRecord}-${endRecord} 条，共 45 条记录`;
    
    // 更新按钮状态
    const prevBtn = document.querySelector('.pagination-controls button:nth-child(2)');
    const nextBtn = document.querySelector('.pagination-controls button:nth-child(7)');
    
    if (page === 1) {
        prevBtn.disabled = true;
        nextBtn.disabled = false;
    } else if (page === 5) {
        prevBtn.disabled = false;
        nextBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
        nextBtn.disabled = false;
    }
    
    showNotification(`已切换到第${page}页`, 'info');
    
    // 这里可以添加实际的数据加载逻辑
    // 模拟数据加载
    setTimeout(() => {
        updateTableData();
    }, 300);
}

// 导出详细数据
function exportDetailedData() {
    showNotification('导出功能开发中，即将支持Excel、PDF等格式', 'info');
}

// 切换表格列
function toggleTableColumns() {
    showNotification('列设置功能开发中，即将支持自定义显示列', 'info');
}
window.handleAISearch = handleAISearch;
window.openFeature = openFeature;
window.applyTimeFilter = applyTimeFilter;
window.resetTimeFilter = resetTimeFilter;

// Webhook相关函数
function viewWebhook(webhookId) {
    console.log('查看Webhook:', webhookId);
    showNotification(`查看Webhook ${webhookId} 详情`, 'info');
}

function editWebhook(webhookId) {
    console.log('编辑Webhook:', webhookId);
    showNotification(`编辑Webhook ${webhookId}`, 'info');
}

function deleteWebhook(webhookId) {
    if (confirm(`确定要删除Webhook ${webhookId} 吗？`)) {
        console.log('删除Webhook:', webhookId);
        showNotification(`Webhook ${webhookId} 已删除`, 'success');
    }
}

// API管理相关函数
function viewAPI(apiId) {
    console.log('查看API:', apiId);
    showNotification(`查看API ${apiId} 详情`, 'info');
}

function editAPI(apiId) {
    console.log('编辑API:', apiId);
    showNotification(`编辑API ${apiId}`, 'info');
}

function deleteAPI(apiId) {
    if (confirm(`确定要删除API ${apiId} 吗？`)) {
        console.log('删除API:', apiId);
        showNotification(`API ${apiId} 已删除`, 'success');
    }
}
window.showProjectForm = showProjectForm;
window.viewProjectPlan = viewProjectPlan;
window.viewProjectMembers = viewProjectMembers;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.viewWebhook = viewWebhook;
window.editWebhook = editWebhook;
window.deleteWebhook = deleteWebhook;
window.viewAPI = viewAPI;
window.editAPI = editAPI;
window.deleteAPI = deleteAPI;

// 数据中心相关函数
function switchDataTab(tabName) {
    // 隐藏所有tab内容
    const tabContents = document.querySelectorAll('#data-centerPage .tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // 移除所有tab按钮的active状态
    const tabButtons = document.querySelectorAll('#data-centerPage .tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的tab内容
    const selectedContent = document.getElementById(`data-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // 激活选中的tab按钮
    const activeButton = event.currentTarget;
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    const tabNames = {
        'cleaning': '数据清洗',
        'sync': '数据同步'
    };
    
    console.log('数据中心切换到:', tabNames[tabName] || tabName);
    showNotification(`已切换到${tabNames[tabName] || tabName}`, 'info');
}

function viewDataTask(taskId) {
    console.log('查看数据任务:', taskId);
    showNotification(`查看数据任务 ${taskId} 详情`, 'info');
}

function editDataTask(taskId) {
    console.log('编辑数据任务:', taskId);
    showNotification(`编辑数据任务 ${taskId}`, 'info');
}

function deleteDataTask(taskId) {
    if (confirm(`确定要删除数据任务 ${taskId} 吗？`)) {
        console.log('删除数据任务:', taskId);
        showNotification(`数据任务 ${taskId} 已删除`, 'success');
    }
}
window.viewContract = viewContract;
window.editContract = editContract;
window.deleteContract = deleteContract;
window.switchDataTab = switchDataTab;
window.viewDataTask = viewDataTask;
window.editDataTask = editDataTask;
window.deleteDataTask = deleteDataTask;
window.viewTimesheetDetail = viewTimesheetDetail;
window.approveTimesheet = approveTimesheet;
window.rejectTimesheet = rejectTimesheet;
window.viewBudgetDetail = viewBudgetDetail;
window.approveBudget = approveBudget;
window.rejectBudget = rejectBudget;
window.refreshTimesheetApprovalList = refreshTimesheetApprovalList;
window.refreshBudgetApprovalList = refreshBudgetApprovalList;
window.changeTimesheetPage = changeTimesheetPage;
window.fetchTimesheetApprovalData = fetchTimesheetApprovalData;
window.loadProjectList = loadProjectList;
window.showProjectForm = showProjectForm;
window.deleteProject = deleteProject;
window.openReportAnalysis = openReportAnalysis;

// ======================== 预算管理 ========================
let budgetsData = [];
let filteredBudgets = [];
let currentBudgetPage = 1;
const budgetsPerPage = 10;

function initializeBudgetManagementPage() {
    // 初始化或刷新数据
    loadBudgets();
}

function loadBudgets() {
    // 模拟数据（可后续替换为后端接口）
    if (budgetsData.length === 0) {
        const depts = ['研发部','产品部','市场部'];
        const statuses = ['pending','submitted','approved','rejected'];
        for (let i = 1; i <= 28; i++) {
            budgetsData.push({
                id: `B${String(i).padStart(3,'0')}`,
                project_code: `P2025-${String(i).padStart(3,'0')}`,
                name: `项目${i}年度预算`,
                version: `v${Math.ceil(i/5)}.0`,
                department: depts[i % depts.length],
                status: statuses[i % statuses.length]
            });
        }
    }
    // 默认不过滤
    filteredBudgets = budgetsData.slice();
    currentBudgetPage = 1;
    renderBudgetTable();
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return '待提交';
        case 'submitted': return '已提交';
        case 'approved': return '已通过';
        case 'rejected': return '已驳回';
        default: return status || '';
    }
}

function renderBudgetTable() {
    const tbody = document.getElementById('budget-list-tbody');
    if (!tbody) return;

    if (!filteredBudgets || filteredBudgets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">暂无预算数据</td></tr>';
        updateBudgetPagination(0, 0, 0);
        return;
    }

    const total = filteredBudgets.length;
    const pages = Math.ceil(total / budgetsPerPage);
    const page = Math.min(Math.max(1, currentBudgetPage), pages);
    const startIdx = (page - 1) * budgetsPerPage;
    const endIdx = Math.min(startIdx + budgetsPerPage, total);
    const pageData = filteredBudgets.slice(startIdx, endIdx);

    tbody.innerHTML = pageData.map(item => `
        <tr>
            <td>${item.project_code}</td>
            <td>${item.name}</td>
            <td>${item.version}</td>
            <td>${item.department}</td>
            <td>${getStatusText(item.status)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="submitBudget('${item.id}')">提交</button>
                    <button class="action-btn delete-btn" onclick="deleteBudget('${item.id}')">删除</button>
                </div>
            </td>
        </tr>
    `).join('');

    updateBudgetPagination(total, page, pages);
}

function updateBudgetPagination(total, page, pages) {
    const info = document.getElementById('budget-pagination-info');
    const pagesEl = document.getElementById('budget-pagination-pages');
    if (info) {
        if (total === 0) {
            info.textContent = '显示 0-0 条，共 0 条记录';
        } else {
            const start = (page - 1) * budgetsPerPage + 1;
            const end = Math.min(page * budgetsPerPage, total);
            info.textContent = `显示 ${start}-${end} 条，共 ${total} 条记录`;
        }
    }
    if (pagesEl) {
        pagesEl.innerHTML = '';
        for (let i = 1; i <= pages; i++) {
            const btn = document.createElement('button');
            btn.className = `pagination-btn ${i === page ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => changeBudgetPage(i);
            pagesEl.appendChild(btn);
        }
    }
}

function changeBudgetPage(direction) {
    if (typeof direction === 'number' && direction > 0) {
        currentBudgetPage = direction;
    } else if (direction === -1) {
        currentBudgetPage = Math.max(1, currentBudgetPage - 1);
    } else if (direction === 1) {
        const pages = Math.ceil((filteredBudgets.length || 0) / budgetsPerPage);
        currentBudgetPage = Math.min(pages, currentBudgetPage + 1);
    }
    renderBudgetTable();
}

function searchBudgets() {
    const code = (document.getElementById('budgetProjectCode')?.value || '').trim().toLowerCase();
    const dept = document.getElementById('budgetDept')?.value || '';
    const status = document.getElementById('budgetStatus')?.value || '';
    filteredBudgets = budgetsData.filter(b => {
        const matchCode = !code || (b.project_code || '').toLowerCase().includes(code);
        const matchDept = !dept || b.department === dept;
        const matchStatus = !status || b.status === status;
        return matchCode && matchDept && matchStatus;
    });
    currentBudgetPage = 1;
    renderBudgetTable();
}

function openNewBudgetModal() {
    const modal = document.getElementById('newBudgetModal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
}

function closeNewBudgetModal() {
    const modal = document.getElementById('newBudgetModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

function saveBudget() {
    const code = document.getElementById('nbProjectCode')?.value?.trim();
    const name = document.getElementById('nbName')?.value?.trim();
    const version = document.getElementById('nbVersion')?.value?.trim();
    const dept = document.getElementById('nbDept')?.value;
    if (!code || !name || !version || !dept) {
        showNotification('请完善必填项', 'warning');
        return;
    }
    budgetsData.unshift({
        id: `B${Date.now()}`,
        project_code: code,
        name,
        version,
        department: dept,
        status: 'pending'
    });
    closeNewBudgetModal();
    searchBudgets();
    showNotification('预算已创建', 'success');
}

function submitBudget(id) {
    const item = budgetsData.find(b => b.id === id);
    if (!item) return;
    if (item.status === 'approved') {
        showNotification('该预算已通过，无需提交', 'info');
        return;
    }
    item.status = 'submitted';
    renderBudgetTable();
    showNotification('已提交预算', 'success');
}

function deleteBudget(id) {
    if (!confirm('确定要删除该预算吗？')) return;
    budgetsData = budgetsData.filter(b => b.id !== id);
    searchBudgets();
    showNotification('预算已删除', 'success');
}

// 导出到全局
window.initializeBudgetManagementPage = initializeBudgetManagementPage;
window.searchBudgets = searchBudgets;
window.changeBudgetPage = changeBudgetPage;
window.openNewBudgetModal = openNewBudgetModal;
window.closeNewBudgetModal = closeNewBudgetModal;
window.saveBudget = saveBudget;
window.submitBudget = submitBudget;
window.deleteBudget = deleteBudget;

window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.showNotification = showNotification;

// 导出报表分析相关函数
window.loadReportAnalysisData = loadReportAnalysisData;
window.loadChartData = loadChartData;
window.updateKPICards = updateKPICards;
window.updateAnalysisTable = updateAnalysisTable;
window.updatePagination = updatePagination;
window.updateChartPlaceholders = updateChartPlaceholders;

// 项目管理相关函数
async function loadProjectList() {
    console.log('开始加载项目列表...');
    
    const tbody = document.getElementById('project-list-tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">正在加载数据...</td></tr>';
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5001/api/projects/detailed', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log('项目列表API响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('获取到的项目数据:', data);
            
            // 兼容两种返回格式：数组 或 { projects, total, page, pages }
            const list = Array.isArray(data) ? data : (data.projects || []);
            updateProjectListTable(list);
            showNotification('项目列表已刷新', 'success');
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('获取项目列表失败:', error);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #f44336;">加载数据失败，请检查网络连接</td></tr>';
        }
        showNotification('获取项目列表失败', 'error');
    }
}

function updateProjectListTable(projects) {
    console.log('updateProjectListTable called with:', projects);
    console.log('projects type:', typeof projects);
    console.log('projects isArray:', Array.isArray(projects));
    
    const tbody = document.getElementById('project-list-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #999;">暂无项目数据</td></tr>';
        return;
    }
    
    let index = 1;
    const typeFilterEl = document.getElementById('projectTypeFilter');
    const typeFilter = typeFilterEl ? (typeFilterEl.value || '') : '';
    projects
      .filter(p => !typeFilter || typeFilter === '交付型')
      .forEach(project => {
        const row = document.createElement('tr');
        let code = project.code || project.project_code || '-';
        if (code === 'P000000000000') {
            code = '-';
        }
        const name = project.name || project.project_name || '-';
        const type = '交付型';
        row.innerHTML = `
            <td style=\"text-align: center;\">${index++}</td>
            <td>${code}</td>
            <td>${name}</td>
            <td>王磊</td>
            <td>${type}</td>
            <td>500.00</td>
            <td>500.00</td>
            <td class=\"op-col\">
                <div class=\"action-buttons\">\n                    <button class=\"action-btn view-btn\" onclick=\"viewProjectMembers('${project.id}')\">项目人员</button>\n                    <button class=\"action-btn edit-btn\" onclick=\"editProject('${project.id}')\">编辑</button>\n                    <button class=\"action-btn delete-btn\" onclick=\"deleteProject('${project.id}')\">删除</button>\n                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterProjectType() {
    loadProjectList();
}
window.filterProjectType = filterProjectType;

// 获取项目状态信息
function getProjectStatusInfo(status) {
    const statusMap = {
        'planning': { text: '规划中', class: 'status-planning' },
        'active': { text: '进行中', class: 'status-active' },
        'completed': { text: '已完成', class: 'status-completed' },
        'paused': { text: '已暂停', class: 'status-paused' }
    };
    
    return statusMap[status] || { text: '未知', class: 'status-unknown' };
}

// 更新项目统计
function updateProjectStats(projects) {
    if (!projects) return;
    
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const avgProgress = projects.length > 0 ? 
        Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length) : 0;
    
    // 更新统计卡片
    const totalElement = document.getElementById('totalProjects');
    const activeElement = document.getElementById('activeProjects');
    const completedElement = document.getElementById('completedProjects');
    const avgProgressElement = document.getElementById('avgProgress');
    
    if (totalElement) totalElement.textContent = total;
    if (activeElement) activeElement.textContent = active;
    if (completedElement) completedElement.textContent = completed;
    if (avgProgressElement) avgProgressElement.textContent = avgProgress + '%';
}

function showProjectForm(projectId = null) {
    console.log('显示项目表单:', projectId);
    showNotification('项目表单功能开发中', 'info');
}

function editProject(projectId) {
    console.log('编辑项目:', projectId);
    showNotification('编辑项目功能开发中', 'info');
}

function deleteProject(projectId) {
    if (confirm('确定要删除这个项目吗？删除后无法恢复！')) {
        console.log('删除项目:', projectId);
        showNotification('删除项目功能开发中', 'info');
    }
}

function searchProjects() {
    const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#project-list-tbody tr');
    
    rows.forEach(row => {
        const projectName = row.cells[1]?.textContent.toLowerCase() || '';
        const projectCode = row.cells[0]?.textContent.toLowerCase() || '';
        
        if (projectName.includes(searchTerm) || projectCode.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// 报表分析跳转函数
function openReportAnalysis() {
    console.log('打开报表分析外部链接...');
    window.open('http://10.10.201.67:8000/#/dashboard-preview?resourceId=5c4da1b2587f4ffbbcf645be9f6984ca', '_blank');
}

// 报表管理跳转函数
function openReportManagement() {
    console.log('打开报表管理外部链接...');
    window.open('http://10.10.201.76:8100/#/workbranch/index', '_blank');
}

// 项目大屏跳转函数
function openProjectDashboard() {
    console.log('打开项目大屏外部链接...');
    window.open('http://10.10.201.76:8100/#/de-link/PLgPsH9r', '_blank');
}

// 智能问数跳转函数
function openAIAssistant() {
    console.log('打开智能问数外部链接...');
    window.open('http://10.10.201.67:8000/#/chat/index', '_blank');
}

// 人员管理页面初始化函数
async function initializeStaffManagementPage() {
    console.log('Staff management page initializer called');
    await loadEmployeeList();
    await loadDepartments();
}

// 加载员工列表
async function loadEmployeeList(page = 1) {
    console.log('Loading employee list for page:', page);
    
    try {
        const params = new URLSearchParams({
            page: page,
            per_page: 10,
            search: ''
        });
        
        const response = await fetch(`http://127.0.0.1:5001/api/employees?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received employee data:', data);
        
        updateEmployeeListTable(data.employees);
        updateEmployeePagination(data.total, data.page, data.pages);
        
    } catch (error) {
        console.error('Error loading employee list:', error);
        showNotification('加载员工列表失败: ' + error.message, 'error');
    }
}

// 更新员工列表表格
function updateEmployeeListTable(employees) {
    const tbody = document.getElementById('employee-list-tbody');
    if (!tbody) return;
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">没有找到员工</td></tr>';
        return;
    }
    
    tbody.innerHTML = employees.map(employee => `
        <tr>
            <td>${employee.id}</td>
            <td>${employee.name || 'N/A'}</td>
            <td>${employee.department || '未分配部门'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editEmployee(${employee.id})">编辑</button>
                    <button class="action-btn delete-btn" onclick="deleteEmployee(${employee.id})">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 更新分页信息
function updateEmployeePagination(total, page, pages) {
    const start = (page - 1) * 10 + 1;
    const end = Math.min(page * 10, total);
    
    const paginationInfo = document.getElementById('employee-pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `显示第 ${start}-${end} 条，共 ${total} 条记录`;
    }
    
    // 更新分页按钮状态
    const prevBtn = document.getElementById('employee-prev-btn');
    const nextBtn = document.getElementById('employee-next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = page <= 1;
    }
    if (nextBtn) {
        nextBtn.disabled = page >= pages;
    }
}

// 加载部门列表
async function loadDepartments() {
    try {
        const response = await fetch('http://127.0.0.1:5001/api/departments');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const departments = await response.json();
        console.log('Received departments:', departments);
        
    } catch (error) {
        console.error('Error loading departments:', error);
        showNotification('加载部门列表失败: ' + error.message, 'error');
    }
}

// 编辑员工
function editEmployee(employeeId) {
    showNotification('编辑功能暂未开放', 'info');
}

// 删除员工
function deleteEmployee(employeeId) {
    showNotification('删除功能暂未开放', 'info');
}



