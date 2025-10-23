// API基地址 - 自动检测当前服务器IP
const API_URL = (() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // 判断是否为域名（包含点号且不是IP地址）
    const isDomain = hostname.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname);
    
    if (isDomain) {
        // 域名时不添加端口号
        return `${protocol}//${hostname}/api`;
    } else {
        // IP地址或localhost时添加端口号
        return `${protocol}//${hostname}:5001/api`;
    }
})();
let selectedProjectData = null; // 用于存储选中的项目数据

// 当前查看的年月（使用服务器当前时间）
const now = new Date();
let currentYear = now.getFullYear();
let currentMonth = now.getMonth() + 1; // getMonth()返回0-11，需要+1

// 加载员工列表（已移除员工选择，保留函数以防其他地方调用）
async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        const employees = await response.json();
        // 不再需要更新DOM，因为员工选择已被移除
    } catch (error) {
        console.error('Failed to load employees:', error);
        showNotification('加载员工列表失败', 'error');
    }
}

// 加载项目列表
async function loadProjects() {
    try {
        
        const response = await fetch(`${API_URL}/projects`, {
            credentials: 'include'  // 添加认证凭证
        });
        console.log('项目API响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('获取到的项目数据:', data);
        
        // 适配不同的返回格式
        const projects = data.projects || data.items || (Array.isArray(data) ? data : []);
        console.log('解析后的项目列表:', projects);
        
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

// 过滤项目列表（工时填报专用）
function filterTimesheetProjects() {
    const searchInput = document.getElementById('projectSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const projectItems = document.querySelectorAll('.project-item');
    
    console.log(`[Timesheet] 搜索项目，关键词: "${searchTerm}", 总项目数: ${projectItems.length}`);
    
    let visibleCount = 0;
    projectItems.forEach(item => {
        const codeElement = item.querySelector('.project-code');
        const nameElement = item.querySelector('.project-name');
        
        if (!codeElement || !nameElement) return;
        
        const code = codeElement.textContent.toLowerCase();
        const name = nameElement.textContent.toLowerCase();
        
        if (code.includes(searchTerm) || name.includes(searchTerm)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    console.log(`[Timesheet] 搜索完成，显示 ${visibleCount} 个项目`);
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
    // 更新当前年月
    if (direction > 0) {
        // 下个月
        if (currentMonth === 12) {
            currentYear++;
            currentMonth = 1;
        } else {
            currentMonth++;
        }
    } else {
        // 上个月
        if (currentMonth === 1) {
            currentYear--;
            currentMonth = 12;
        } else {
            currentMonth--;
        }
    }
    
    console.log(`切换到 ${currentYear}年${currentMonth}月`);
    
    // 更新页面标题
    updateCalendarTitle();
    
    // 重新加载数据
    fetchAndDisplayReports(currentYear, currentMonth);
    loadMonthlyStats(currentYear, currentMonth);
    
    showNotification(`切换到${currentYear}年${currentMonth}月`, 'info');
}

// 更新日历标题和日历内容
function updateCalendarTitle() {
    // 更新左侧月份选择器
    const currentMonthEl = document.querySelector('.current-month');
    if (currentMonthEl) {
        currentMonthEl.textContent = `${currentYear}年${currentMonth}月`;
    }
    
    // 更新右侧日历标题
    const calendarTitleEl = document.querySelector('.calendar-title');
    if (calendarTitleEl) {
        calendarTitleEl.textContent = `${currentYear}年${currentMonth}月工时填报`;
    }
    
    // 重新生成日历
    generateCalendar(currentYear, currentMonth);
}

// 生成日历
function generateCalendar(year, month) {
    const calendarBody = document.querySelector('.calendar tbody');
    if (!calendarBody) return;
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    
    // 获取当月第一天是星期几（0=周日，1=周一...）
    const firstDayOfWeek = firstDay.getDay();
    
    // 清空现有内容
    calendarBody.innerHTML = '';
    
    let date = 1;
    let nextMonthDate = 1;
    
    // 生成6行日历（足够显示任何月份）
    for (let week = 0; week < 6; week++) {
        const row = document.createElement('tr');
        
        // 生成一周的7天
        for (let day = 0; day < 7; day++) {
            const cell = document.createElement('td');
            
            if (week === 0 && day < firstDayOfWeek) {
                // 上个月的日期
                const prevMonth = month === 1 ? 12 : month - 1;
                const prevYear = month === 1 ? year - 1 : year;
                const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();
                const prevDate = prevMonthLastDay - (firstDayOfWeek - day - 1);
                
                cell.className = 'other-month';
                cell.innerHTML = `
                    <div class="calendar-date">${prevDate}</div>
                    <div class="calendar-status"></div>
                `;
            } else if (date > daysInMonth) {
                // 下个月的日期
                cell.className = 'other-month';
                cell.innerHTML = `
                    <div class="calendar-date">${nextMonthDate}</div>
                    <div class="calendar-status"></div>
                `;
                nextMonthDate++;
            } else {
                // 当月的日期
                const dateStr = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
                const isToday = new Date().toDateString() === new Date(year, month - 1, date).toDateString();
                
                cell.className = isToday ? 'today' : '';
                cell.setAttribute('onclick', `openTimesheetModal('${dateStr}')`);
                cell.innerHTML = `
                    <div class="calendar-date">${date}</div>
                    <div class="calendar-status"></div>
                `;
                date++;
            }
            
            row.appendChild(cell);
        }
        
        calendarBody.appendChild(row);
        
        // 如果已经显示完所有日期，停止生成
        if (date > daysInMonth && week >= 4) break;
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
            credentials: 'include',
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
async function fetchAndDisplayReports(year = currentYear, month = currentMonth) {
    try {
        console.log(`开始获取报工数据... 年月: ${year}-${month}`);
        const response = await fetch(`${API_URL}/reports?year=${year}&month=${month}`, { credentials: 'include' });
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
async function loadMonthlyStats(year = currentYear, month = currentMonth) {
    try {
        // 使用当前选择的年月
        
        console.log(`正在加载 ${year}年${month}月 的统计数据...`);
        console.log(`API URL: ${API_URL}/stats/${year}/${month}`);
        
        const response = await fetch(`${API_URL}/stats/${year}/${month}`, { credentials: 'include' });
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
                
                // 为每个报工记录创建状态点和项目名称
                dateReports.forEach(report => {
                    // 创建报工记录项容器
                    const reportItem = document.createElement('div');
                    reportItem.className = 'report-item';
                    
                    // 创建状态点
                    const dot = document.createElement('span');
                    // 根据status字段设置不同的样式（1=已通过，2=待审核，3=已驳回，4=请假）
                    const status = Number(report.status);
                    if (status === 1) {
                        dot.className = 'status-dot status-approved'; // 绿色点 - 已通过
                    } else if (status === 2) {
                        dot.className = 'status-dot status-pending'; // 黄色点 - 待审核
                    } else if (status === 3) {
                        dot.className = 'status-dot status-rejected'; // 红色点 - 已驳回
                    } else {
                        dot.className = 'status-dot status-pending'; // 默认黄色点 - 待审核
                    }
                    reportItem.appendChild(dot);
                    
                    // 创建项目名称标签
                    const projectLabel = document.createElement('span');
                    projectLabel.className = 'project-label';
                    projectLabel.textContent = report.project_name || report.project_code || '未知项目';
                    projectLabel.title = `${report.project_name || report.project_code || '未知项目'} - ${report.hours_spent}小时`;
                    reportItem.appendChild(projectLabel);
                    
                    // 将报工记录项添加到状态容器
                    statusContainer.appendChild(reportItem);
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
        const response = await fetch(`${API_URL}/reports/${date}`, { credentials: 'include' });
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
                console.log('About to call getStatusText with:', report.status);
                console.log('getStatusText function:', getStatusText);
                let statusLabelText = getTimesheetStatusText(report.status);
                let statusLabelClass = getTimesheetStatusClass(report.status);
                console.log('Got statusLabelText:', statusLabelText, 'statusLabelClass:', statusLabelClass);
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
                            <div class="report-project-name" title="${report.project_name}" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">${report.project_name}</div>
                        </div>
                        <div class="report-hours-info">
                            <div class="report-hours">${report.hours_spent}小时</div>
                            <div class="report-days">${days}人天</div>
                        </div>
                    </div>
                    <div class="report-content">
                        <div class="report-content-label">工作内容</div>
                        <div class="report-content-text" style="word-break: break-all; overflow-wrap: break-word; max-height: 100px; overflow-y: auto;">${report.task_description}</div>
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
                    ${Number(report.status) === 0 ? `
                    <div class="report-actions">
                        <button class="btn btn-danger btn-small" onclick="withdrawTimesheet(${report.id})">撤销</button>
                    </div>
                    ` : ''}
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

// 从工时详情模态框打开新增工时模态框
function openTimesheetModalFromDetail() {
    // 获取当前查看的日期
    const detailDate = document.getElementById('detailDate');
    const currentDate = detailDate ? detailDate.textContent : '';
    
    // 关闭详情模态框
    closeTimesheetDetailModal();
    
    // 延迟一点时间再打开新增工时模态框，确保关闭动画完成
    setTimeout(() => {
        // 如果有日期信息，将其转换为标准格式并传递给新增工时模态框
        if (currentDate && currentDate !== '--') {
            try {
                // 将中文日期格式转换为标准日期格式
                const dateMatch = currentDate.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
                if (dateMatch) {
                    const [, year, month, day] = dateMatch;
                    const standardDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    openTimesheetModal(standardDate);
                } else {
                    openTimesheetModal();
                }
            } catch (error) {
                console.error('日期格式转换失败:', error);
                openTimesheetModal();
            }
        } else {
            openTimesheetModal();
        }
    }, 300);
}

// 撤销工时记录
async function withdrawTimesheet(reportId) {
    if (!confirm('确定要撤销这条工时记录吗？撤销后将无法恢复。')) {
        return;
    }
    
    try {
        console.log('撤销工时记录:', reportId);
        
        const response = await fetch(`${API_URL}/reports/${reportId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('撤销成功:', result);
        
        showNotification('工时记录已撤销', 'success');
        
        // 关闭详情模态框
        closeTimesheetDetailModal();
        
        // 刷新页面数据
        if (typeof fetchAndDisplayReports === 'function') {
            fetchAndDisplayReports();
        }
        if (typeof loadMonthlyStats === 'function') {
            loadMonthlyStats();
        }
        
    } catch (error) {
        console.error('撤销工时记录失败:', error);
        showNotification(`撤销失败: ${error.message}`, 'error');
    }
}

// 状态辅助函数
function getTimesheetStatusText(status) {
    console.log('getTimesheetStatusText called with:', status, typeof status);
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
    console.log('getTimesheetStatusText converted to number:', s);
    let result;
    switch (s) {
        case 1: result = '已通过'; break;
        case 2: result = '待审核'; break;
        case 0: result = '待审核'; break;
        case 4: result = '请假'; break;
        case 3: result = '已驳回'; break;
        default: result = '待审核'; break;
    }
    console.log('getTimesheetStatusText result:', result);
    return result;
}

function getTimesheetStatusClass(status) {
    console.log('getTimesheetStatusClass called with:', status, typeof status);
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
    console.log('getTimesheetStatusClass converted to number:', s);
    let result;
    switch (s) {
        case 1: result = 'status-approved'; break;
        case 2: result = 'status-pending'; break;
        case 0: result = 'status-pending'; break;
        case 4: result = 'status-leave'; break;
        case 3: result = 'status-rejected'; break;
        default: result = 'status-pending'; break;
    }
    console.log('getTimesheetStatusClass result:', result);
    return result;
}

// 将函数暴露到全局作用域
window.openTimesheetModal = openTimesheetModal;
window.closeTimesheetModal = closeTimesheetModal;
window.openTimesheetDetailModal = openTimesheetDetailModal;
window.closeTimesheetDetailModal = closeTimesheetDetailModal;
window.openTimesheetModalFromDetail = openTimesheetModalFromDetail;
window.withdrawTimesheet = withdrawTimesheet;
window.selectProject = selectProject;
window.filterTimesheetProjects = filterTimesheetProjects;
window.calculateDays = calculateDays;
window.changeMonth = changeMonth;
window.updateCalendarTitle = updateCalendarTitle;
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
    console.log(`当前服务器时间: ${currentYear}年${currentMonth}月`);
    
    // 初始化页面标题
    updateCalendarTitle();
    
    // 加载当前月份的数据
    if (typeof fetchAndDisplayReports === 'function') {
        fetchAndDisplayReports(currentYear, currentMonth);
    }
    if (typeof loadMonthlyStats === 'function') {
        loadMonthlyStats(currentYear, currentMonth);
    }
}

window.initializeTimesheetPage = initializeTimesheetPage;

