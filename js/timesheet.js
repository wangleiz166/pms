// API基地址
const API_URL = 'http://127.0.0.1:5001/api';
let selectedProjectData = null; // 用于存储选中的项目数据

// 加载员工列表（已移除员工选择，保留函数以防其他地方调用）
async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        const employees = await response.json();
        console.log('员工数据加载成功:', employees);
        // 不再需要更新DOM，因为员工选择已被移除
    } catch (error) {
        console.error('Failed to load employees:', error);
        showNotification('加载员工列表失败', 'error');
    }
}

// 加载项目列表
async function loadProjects() {
    try {
        console.log('开始加载项目列表...');
        console.log(`API URL: ${API_URL}/projects`);
        
        const response = await fetch(`${API_URL}/projects`);
        console.log('项目API响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const projects = await response.json();
        console.log('获取到的项目数据:', projects);
        
        const projectList = document.getElementById('projectList');
        console.log('项目列表容器:', projectList);
        
        if (!projectList) {
            console.error('找不到projectList元素！');
            return;
        }
        
        projectList.innerHTML = ''; // 清空现有列表
        
        if (projects.length === 0) {
            projectList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">暂无项目</div>';
            console.log('没有项目数据');
            return;
        }
        
        projects.forEach(proj => {
            const item = document.createElement('div');
            item.className = 'project-item';
            item.onclick = () => selectProject(proj.id, proj.project_name, proj.project_code);
            item.innerHTML = `
                <div class="project-code">${proj.project_code}</div>
                <div class="project-name">${proj.project_name}</div>
            `;
            projectList.appendChild(item);
            console.log(`添加项目: ${proj.project_code} - ${proj.project_name}`);
        });
        
        console.log(`成功加载 ${projects.length} 个项目`);
    } catch (error) {
        console.error('Failed to load projects:', error);
        showNotification('加载项目列表失败', 'error');
        
        // 显示错误状态
        const projectList = document.getElementById('projectList');
        if (projectList) {
            projectList.innerHTML = '<div style="text-align: center; color: red; padding: 20px;">加载项目失败</div>';
        }
    }
}

// 工时填报相关功能

// 打开工时填报模态框
// 打开工时填报模态框
function openTimesheetModal(date = '') {

    const modal = document.getElementById('timesheetModal');
    const workDateInput = document.getElementById('workDate');
    
    if (!modal || !workDateInput) return;
    
    if (date) {
        workDateInput.value = date;
    } else {
        workDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // 加载项目数据
    loadProjects();
    
    modal.classList.add('show');
}

// 关闭工时填报模态框
function closeTimesheetModal() {
    const modal = document.getElementById('timesheetModal');
    const form = document.getElementById('timesheetForm');
    
    if (modal) {
        modal.classList.remove('show');
    }
    
    if (form) {
        form.reset();
    }
    
    selectedProjectData = null;
    document.querySelectorAll('.project-item').forEach(item => item.classList.remove('selected'));
}

// 选择项目
function selectProject(id, name, code) {
    selectedProjectData = { id, name, code };
    const selectedProjectInput = document.getElementById('selectedProject');
    
    if (selectedProjectInput) {
        selectedProjectInput.value = id;
    }
    
    // 更新UI
    document.querySelectorAll('.project-item').forEach(item => item.classList.remove('selected'));
    if (event && event.target) {
        const projectItem = event.target.closest('.project-item');
        if (projectItem) {
            projectItem.classList.add('selected');
        }
    }
    
    showNotification(`已选择项目：${name}`, 'success');
}

// 过滤项目列表
function filterProjects() {
    const searchInput = document.getElementById('projectSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const projectItems = document.querySelectorAll('.project-item');
    
    projectItems.forEach(item => {
        const codeElement = item.querySelector('.project-code');
        const nameElement = item.querySelector('.project-name');
        
        if (!codeElement || !nameElement) return;
        
        const code = codeElement.textContent.toLowerCase();
        const name = nameElement.textContent.toLowerCase();
        
        if (code.includes(searchTerm) || name.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 计算人天
function calculateDays() {
    const hoursInput = document.getElementById('workHours');
    const daysInput = document.getElementById('workDays');
    
    if (!hoursInput || !daysInput) return;
    
    const hours = parseFloat(hoursInput.value) || 0;
    const days = (hours / 8).toFixed(1);
    daysInput.value = days;
}

// 切换月份
function changeMonth(direction) {
    // 这里可以实现月份切换逻辑
    showNotification(`切换到${direction > 0 ? '下' : '上'}个月`, 'info');
    
    // 重新加载统计数据（这里可以扩展为支持不同月份的统计）
    if (typeof loadMonthlyStats === 'function') {
        loadMonthlyStats();
    }
}

// 假期同步功能
async function syncHolidays() {
    try {
        // 显示加载状态
        showNotification('正在同步假期数据...', 'info');

        // 等待2秒模拟同步过程
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 模拟同步成功
        showNotification('假期同步成功！', 'success');

        // 刷新页面数据
        if (typeof fetchAndDisplayReports === 'function') {
            fetchAndDisplayReports();
        }
        if (typeof loadMonthlyStats === 'function') {
            loadMonthlyStats();
        }

    } catch (error) {
        console.error('假期同步失败:', error);
        showNotification('假期同步失败，请稍后重试', 'error');
    }
}

// 提交工时表单
async function submitTimesheet(event) {
    event.preventDefault();

    const report = {
        report_date: document.getElementById('workDate').value,
        employee_id: 1, // 默认使用1号员工
        project_id: selectedProjectData ? selectedProjectData.id : null,
        task_description: document.getElementById('workContent').value,
        hours_spent: document.getElementById('workHours').value
    };

    if (!report.report_date || !report.project_id || !report.task_description || !report.hours_spent) {
        showNotification('请填写所有必填项', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(report)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('工时提交成功', 'success');
            closeTimesheetModal();
            fetchAndDisplayReports(); // 重新加载数据
            loadMonthlyStats(); // 重新加载统计数据
        } else {
            showNotification(`提交失败: ${result.message}`, 'error');
        }
    } catch (error) {
        showNotification(`提交出错: ${error.message}`, 'error');
    }
}

// 获取并显示报工数据
async function fetchAndDisplayReports() {
    try {
        console.log('开始获取报工数据...');
        const response = await fetch(`${API_URL}/reports`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reports = await response.json();
        console.log('获取到的报工数据:', reports);
        updateCalendar(reports);
        console.log('报工数据加载完成');
    } catch (error) {
        console.error('加载报工数据失败:', error);
        showNotification(`加载报工数据失败: ${error.message}`, 'error');
    }
}

// 加载月度统计数据
async function loadMonthlyStats() {
    try {
        // 默认使用2025年8月的数据
        const year = 2025;
        const month = 8;
        
        console.log(`正在加载 ${year}年${month}月 的统计数据...`);
        console.log(`API URL: ${API_URL}/stats/${year}/${month}`);
        
        const response = await fetch(`${API_URL}/stats/${year}/${month}`);
        console.log(`API响应状态: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stats = await response.json();
        console.log('获取到的统计数据:', stats);
        
        // 更新统计数据显示
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('Failed to load monthly stats:', error);
        showNotification(`加载统计数据失败: ${error.message}`, 'error');
        
        // 显示错误状态
        updateStatsDisplay({
            total_hours: 0,
            total_days_worked: 0,
            project_count: 0,
            fill_rate: 0,
            working_days: 0,
            total_days: 0
        });
    }
}

// 更新统计数据显示
function updateStatsDisplay(stats) {
    console.log('开始更新统计数据显示:', stats);
    
    // 更新本月工时
    const hoursElement = document.querySelector('.stats-card:nth-child(1) .stats-number');
    console.log('工时元素:', hoursElement);
    if (hoursElement) {
        hoursElement.innerHTML = `${stats.total_hours} <span class="stats-unit">小时</span>`;
        console.log('已更新工时显示');
    }
    
    // 更新本月人天
    const daysElement = document.querySelector('.stats-card:nth-child(2) .stats-number');
    console.log('人天元素:', daysElement);
    if (daysElement) {
        daysElement.innerHTML = `${stats.total_days_worked} <span class="stats-unit">天</span>`;
        console.log('已更新人天显示');
    }
    
    // 更新参与项目数
    const projectsElement = document.querySelector('.stats-card:nth-child(3) .stats-number');
    console.log('项目元素:', projectsElement);
    if (projectsElement) {
        projectsElement.innerHTML = `${stats.project_count} <span class="stats-unit">个</span>`;
        console.log('已更新项目数显示');
    }
    
    // 更新填报率
    const fillRateElement = document.querySelector('.stats-card:nth-child(4) .stats-number');
    console.log('填报率元素:', fillRateElement);
    if (fillRateElement) {
        fillRateElement.innerHTML = `${stats.fill_rate}% <span class="stats-unit">完成度</span>`;
        console.log('已更新填报率显示');
    }
    
    // 更新趋势信息（这里可以添加与上个月的对比逻辑）
    updateTrendInfo(stats);
    console.log('统计数据显示更新完成');
}

// 更新趋势信息
function updateTrendInfo(stats) {
    // 这里可以添加与上个月对比的逻辑
    // 暂时显示静态信息，后续可以扩展
    const trendElements = document.querySelectorAll('.stats-trend');
    if (trendElements.length >= 4) {
        trendElements[0].textContent = `本月已工作 ${stats.working_days} 天`;
        const avgDays = stats.working_days > 0 ? (stats.total_days_worked / stats.working_days).toFixed(1) : '0.0';
        trendElements[1].textContent = `平均每天 ${avgDays} 人天`;
        trendElements[2].textContent = `涉及 ${stats.project_count} 个项目`;
        trendElements[3].textContent = `本月共 ${stats.total_days} 天`;
    }
}

// 更新日历视图
function updateCalendar(reports) {
    console.log('开始更新日历视图，报工数据:', reports);
    
    // 清除旧的状态点
    document.querySelectorAll('.calendar-status').forEach(el => el.innerHTML = '');

    // 创建一个映射，key为日期，value为报工次数
    const reportCounts = reports.reduce((acc, report) => {
        const date = report.report_date.split('T')[0]; // 兼容datetime格式
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    console.log('报工日期映射:', reportCounts);

    // 在日历上添加状态点并修改点击事件
    Object.keys(reportCounts).forEach(date => {
        const cell = document.querySelector(`td[onclick*="'${date}'"]`);
        if (cell) {
            console.log(`找到日期 ${date} 的单元格，添加状态点`);
            const statusContainer = cell.querySelector('.calendar-status');
            if (statusContainer) {
                // 获取该日期的所有报工记录
                const dateReports = reports.filter(report => {
                    const reportDate = report.report_date.split('T')[0];
                    return reportDate === date;
                });
                
                // 为每个报工记录创建状态点
                dateReports.forEach(report => {
                    const dot = document.createElement('span');
                    // 根据status字段设置不同的样式
                    if (report.status === 1) {
                        dot.className = 'status-dot status-completed'; // 绿色点 - 已审核
                    } else if (report.status === 2) {
                        dot.className = 'status-dot status-rejected'; // 红色点 - 已驳回
                    } else if (report.status === 4) {
                        dot.className = 'status-dot status-leave'; // 蓝色点 - 请假
                    } else {
                        dot.className = 'status-dot status-pending'; // 黄色点 - 待审核
                    }
                    statusContainer.appendChild(dot);
                });
            }
            // 修改点击事件为查看详情
            cell.setAttribute('onclick', `openTimesheetDetailModal('${date}')`);
        }
    });
    
    // 为没有报工数据的日期设置新增工时事件
    document.querySelectorAll('td[onclick*="openTimesheetModal"]').forEach(cell => {
        const dateMatch = cell.getAttribute('onclick').match(/'([^']+)'/);
        if (dateMatch) {
            const date = dateMatch[1];
            if (!reportCounts[date]) {
                // 保持原有的新增工时事件
                cell.setAttribute('onclick', `openTimesheetModal('${date}')`);
            }
        }
    });
    
    console.log('日历视图已更新完成');
}

// 打开工时详情查看模态框
async function openTimesheetDetailModal(date) {
    const modal = document.getElementById('timesheetDetailModal');
    const detailDate = document.getElementById('detailDate');
    const reportsList = document.getElementById('detailReportsList');
    
    if (!modal || !detailDate || !reportsList) return;
    
    // 设置日期，确保格式正确
    if (date) {
        // 格式化日期显示
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        detailDate.textContent = formattedDate;
    } else {
        detailDate.textContent = '--';
    }
    
    // 显示模态框
    modal.classList.add('show');
    
    // 加载该日期的报工数据
    try {
        const response = await fetch(`${API_URL}/reports/${date}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reports = await response.json();
        
        // 清空现有内容
        reportsList.innerHTML = '';
        
        if (reports.length === 0) {
            // 显示空状态
            reportsList.innerHTML = `
                <div class="empty-reports">
                    <div class="empty-reports-icon">📝</div>
                    <div class="empty-reports-text">该日期暂无工时填报</div>
                    <div class="empty-reports-hint">点击"新增工时"按钮开始填报</div>
                </div>
            `;
        } else {
            // 显示报工详情卡片
            reports.forEach(report => {
                try { console.log('Timesheet detail status:', report.status, typeof report.status, report); } catch(e) {}
                const days = (report.hours_spent / 8).toFixed(1);
                // 统一状态渲染（兼容后端可能返回字符串/未设置4的情况）
                let statusLabelText = getStatusText(report.status);
                let statusLabelClass = getStatusClass(report.status);
                if (Number(report.status) !== 4 && typeof report.task_description === 'string' && report.task_description.trim() === '请假') {
                    statusLabelText = '请假';
                    statusLabelClass = 'status-leave';
                }
                const reportCard = document.createElement('div');
                reportCard.className = 'report-detail-card';
                reportCard.innerHTML = `
                    <div class="report-detail-header">
                        <div class="report-project-info">
                            <div class="report-project-code">${report.project_code}</div>
                            <div class="report-project-name">${report.project_name}</div>
                        </div>
                        <div class="report-hours-info">
                            <div class="report-hours">${report.hours_spent}小时</div>
                            <div class="report-days">${days}人天</div>
                        </div>
                    </div>
                    <div class="report-content">
                        <div class="report-content-label">工作内容</div>
                        <div class="report-content-text">${report.task_description}</div>
                    </div>
                    <div class="report-meta">
                        <div class="report-employee">
                            <span>👤</span>
                            <span>${report.employee_name}</span>
                        </div>
                        <div class="report-time">
                            <span>🕒</span>
                            <span>${new Date(report.report_date).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <div class="report-status">
                            <span>📊</span>
                            <span class="status-label ${statusLabelClass}">${statusLabelText}</span>
                        </div>
                    </div>
                `;
                // 再次强制规范状态元素，避免历史类名残留（如 pending/approved）
                const statusEl = reportCard.querySelector('.status-label');
                if (statusEl) {
                    statusEl.className = `status-label ${statusLabelClass}`;
                    statusEl.textContent = statusLabelText;
                }
                reportsList.appendChild(reportCard);
            });
        }
    } catch (error) {
        console.error('Failed to load timesheet details:', error);
        reportsList.innerHTML = `
            <div class="empty-reports">
                <div class="empty-reports-icon">❌</div>
                <div class="empty-reports-text">加载工时详情失败</div>
                <div class="empty-reports-hint">${error.message}</div>
            </div>
        `;
    }
}

// 关闭工时详情查看模态框
function closeTimesheetDetailModal() {
    const modal = document.getElementById('timesheetDetailModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 状态辅助函数
function getStatusText(status) {
    // 兼容字符串状态
    if (typeof status === 'string') {
        const key = status.toLowerCase();
        if (key === 'pending') return '待审核';
        if (key === 'approved') return '已通过';
        if (key === 'rejected') return '已驳回';
        if (key === 'leave') return '请假';
        const maybeNum = Number(status);
        if (!Number.isNaN(maybeNum)) status = maybeNum;
    }
    const s = Number(status);
    switch (s) {
        case 0: return '待审核';
        case 1: return '已通过';
        case 2: return '已驳回';
        case 4: return '请假';
        default: return '未知状态';
    }
}

function getStatusClass(status) {
    // 兼容字符串状态
    if (typeof status === 'string') {
        const key = status.toLowerCase();
        if (key === 'pending') return 'status-pending';
        if (key === 'approved') return 'status-approved';
        if (key === 'rejected') return 'status-rejected';
        if (key === 'leave') return 'status-leave';
        const maybeNum = Number(status);
        if (!Number.isNaN(maybeNum)) status = maybeNum;
    }
    const s = Number(status);
    switch (s) {
        case 0: return 'status-pending';
        case 1: return 'status-approved';
        case 2: return 'status-rejected';
        case 4: return 'status-leave';
        default: return 'unknown';
    }
}

// 将函数暴露到全局作用域
window.openTimesheetModal = openTimesheetModal;
window.closeTimesheetModal = closeTimesheetModal;
window.openTimesheetDetailModal = openTimesheetDetailModal;
window.closeTimesheetDetailModal = closeTimesheetDetailModal;
window.selectProject = selectProject;
window.filterProjects = filterProjects;
window.calculateDays = calculateDays;
window.changeMonth = changeMonth;
window.syncHolidays = syncHolidays;
window.submitTimesheet = submitTimesheet;
window.loadMonthlyStats = loadMonthlyStats;
window.fetchAndDisplayReports = fetchAndDisplayReports;

/**
 * 初始化工时表页面
 * 该函数将在页面加载时调用，用于获取和显示所有必要的数据。
 */
function initializeTimesheetPage() {
    console.log('Initializing Timesheet Page...');
    if (typeof fetchAndDisplayReports === 'function') {
        fetchAndDisplayReports();
    }
    if (typeof loadMonthlyStats === 'function') {
        loadMonthlyStats();
    }
}

window.initializeTimesheetPage = initializeTimesheetPage;

