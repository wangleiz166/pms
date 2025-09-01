// 项目管理系统 - 完整版JavaScript

// 当前活跃页面
let currentPage = 'timesheet';
let currentUser = '王磊';

// 页面切换函数
function switchPage(pageId) {
    console.log('切换到页面:', pageId);
    
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
        currentPage = pageId;
        console.log('页面切换成功:', pageId);
        
        // 如果切换到报表分析页面，自动加载数据
        if (pageId === 'report-analysis') {
            setTimeout(() => {
                updateTableData();
            }, 100);
        }
    } else {
        console.error('页面不存在:', pageId + 'Page');
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
    
    console.log('审核中心切换到:', tabName);
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

function approveTimesheet(timesheetId) {
    if (confirm('确定要通过这条报工记录吗？')) {
        console.log('通过报工:', timesheetId);
        showNotification(`报工记录 ${timesheetId} 已通过`, 'success');
    }
}

function rejectTimesheet(timesheetId) {
    if (confirm('确定要驳回这条报工记录吗？')) {
        console.log('驳回报工:', timesheetId);
        showNotification(`报工记录 ${timesheetId} 已驳回`, 'warning');
    }
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

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化...');
    
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
    
    console.log('初始化完成');
    
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
});

// 导出函数供HTML调用
window.switchPage = switchPage;
window.switchApprovalTab = switchApprovalTab;
window.switchSystemTab = switchSystemTab;
window.switchTimeDimension = switchTimeDimension;

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
        const response = await fetch(`/api/reports/analysis?time_range=${timeRange}&page=1&per_page=10`);
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
            fetch('/api/charts/hours-trend').then(r => r.json()),
            fetch('/api/charts/project-progress').then(r => r.json()),
            fetch('/api/charts/team-efficiency').then(r => r.json()),
            fetch('/api/charts/financial-analysis').then(r => r.json())
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

