// 团队管理相关功能

// 当前选中的团队ID
let currentTeamId = null;

// 团队数据
const teamsData = [
    {
        id: 1,
        name: '前端开发团队',
        description: '负责前端界面开发和用户体验优化',
        leader: '张三',
        memberCount: 5,
        status: 'active',
        createDate: '2024-01-15',
        totalHours: 1200,
        avgHours: 240,
        projects: 3
    },
    {
        id: 2,
        name: '后端开发团队',
        description: '负责后端API开发和数据库设计',
        leader: '李四',
        memberCount: 4,
        status: 'active',
        createDate: '2024-01-20',
        totalHours: 980,
        avgHours: 245,
        projects: 2
    },
    {
        id: 3,
        name: '测试团队',
        description: '负责软件测试和质量保证',
        leader: '王五',
        memberCount: 3,
        status: 'active',
        createDate: '2024-02-01',
        totalHours: 720,
        avgHours: 240,
        projects: 4
    },
    {
        id: 4,
        name: '运维团队',
        description: '负责系统运维和部署',
        leader: '赵六',
        memberCount: 2,
        status: 'inactive',
        createDate: '2024-02-10',
        totalHours: 480,
        avgHours: 240,
        projects: 1
    }
];

// 成员数据
const membersData = {
    1: [
        { id: 1, name: '张三', role: '团队负责人', avatar: '张', hours: 240, status: 'active' },
        { id: 2, name: '李小明', role: '高级前端工程师', avatar: '李', hours: 220, status: 'active' },
        { id: 3, name: '王小红', role: '前端工程师', avatar: '王', hours: 200, status: 'active' },
        { id: 4, name: '赵小刚', role: 'UI设计师', avatar: '赵', hours: 180, status: 'active' },
        { id: 5, name: '陈小丽', role: '前端实习生', avatar: '陈', hours: 160, status: 'active' }
    ],
    2: [
        { id: 6, name: '李四', role: '团队负责人', avatar: '李', hours: 245, status: 'active' },
        { id: 7, name: '刘小强', role: '高级后端工程师', avatar: '刘', hours: 230, status: 'active' },
        { id: 8, name: '周小华', role: '后端工程师', avatar: '周', hours: 210, status: 'active' },
        { id: 9, name: '吴小军', role: '数据库工程师', avatar: '吴', hours: 195, status: 'active' }
    ],
    3: [
        { id: 10, name: '王五', role: '团队负责人', avatar: '王', hours: 240, status: 'active' },
        { id: 11, name: '郑小燕', role: '测试工程师', avatar: '郑', hours: 220, status: 'active' },
        { id: 12, name: '孙小波', role: '自动化测试工程师', avatar: '孙', hours: 200, status: 'active' }
    ],
    4: [
        { id: 13, name: '赵六', role: '团队负责人', avatar: '赵', hours: 240, status: 'inactive' },
        { id: 14, name: '钱小东', role: '运维工程师', avatar: '钱', hours: 240, status: 'inactive' }
    ]
};

// 工时汇总数据
const timesheetData = {
    1: {
        summary: {
            totalHours: 1200,
            totalDays: 150,
            avgHoursPerDay: 8.0,
            fillRate: 95.5
        },
        details: [
            { name: '张三', project: '项目A', hours: 240, days: 30, status: '已完成', lastUpdate: '2025-08-15' },
            { name: '李小明', project: '项目B', hours: 220, days: 27.5, status: '进行中', lastUpdate: '2025-08-14' },
            { name: '王小红', project: '项目A', hours: 200, days: 25, status: '已完成', lastUpdate: '2025-08-13' },
            { name: '赵小刚', project: '项目C', hours: 180, days: 22.5, status: '进行中', lastUpdate: '2025-08-14' },
            { name: '陈小丽', project: '项目B', hours: 160, days: 20, status: '进行中', lastUpdate: '2025-08-14' }
        ]
    },
    2: {
        summary: {
            totalHours: 980,
            totalDays: 122.5,
            avgHoursPerDay: 8.0,
            fillRate: 92.3
        },
        details: [
            { name: '李四', project: '项目D', hours: 245, days: 30.6, status: '已完成', lastUpdate: '2025-08-15' },
            { name: '刘小强', project: '项目E', hours: 230, days: 28.8, status: '进行中', lastUpdate: '2025-08-14' },
            { name: '周小华', project: '项目D', hours: 210, days: 26.3, status: '已完成', lastUpdate: '2025-08-13' },
            { name: '吴小军', project: '项目E', hours: 195, days: 24.4, status: '进行中', lastUpdate: '2025-08-14' }
        ]
    },
    3: {
        summary: {
            totalHours: 720,
            totalDays: 90,
            avgHoursPerDay: 8.0,
            fillRate: 88.9
        },
        details: [
            { name: '王五', project: '项目F', hours: 240, days: 30, status: '已完成', lastUpdate: '2025-08-15' },
            { name: '郑小燕', project: '项目G', hours: 220, days: 27.5, status: '进行中', lastUpdate: '2025-08-14' },
            { name: '孙小波', project: '项目F', hours: 200, days: 25, status: '已完成', lastUpdate: '2025-08-13' }
        ]
    },
    4: {
        summary: {
            totalHours: 480,
            totalDays: 60,
            avgHoursPerDay: 8.0,
            fillRate: 100.0
        },
        details: [
            { name: '赵六', project: '项目H', hours: 240, days: 30, status: '已完成', lastUpdate: '2025-08-15' },
            { name: '钱小东', project: '项目H', hours: 240, days: 30, status: '已完成', lastUpdate: '2025-08-15' }
        ]
    }
};

// 项目数据
const projectsData = {
    1: [
        { id: 1, name: '电商平台前端', code: 'EC-FRONT', status: 'active', progress: 75 },
        { id: 2, name: '管理后台系统', code: 'ADMIN-SYS', status: 'active', progress: 60 },
        { id: 3, name: '移动端应用', code: 'MOBILE-APP', status: 'completed', progress: 100 }
    ],
    2: [
        { id: 4, name: '电商平台后端', code: 'EC-BACKEND', status: 'active', progress: 80 },
        { id: 5, name: 'API网关服务', code: 'API-GATEWAY', status: 'active', progress: 45 }
    ],
    3: [
        { id: 6, name: '自动化测试平台', code: 'AUTO-TEST', status: 'active', progress: 30 },
        { id: 7, name: '性能测试工具', code: 'PERF-TOOL', status: 'completed', progress: 100 },
        { id: 8, name: '测试数据管理', code: 'TEST-DATA', status: 'active', progress: 55 },
        { id: 9, name: '质量监控系统', code: 'QUALITY-MON', status: 'active', progress: 25 }
    ],
    4: [
        { id: 10, name: '服务器监控系统', code: 'SERVER-MON', status: 'completed', progress: 100 }
    ]
};

/**
 * 查看团队详情
 */
function viewTeamDetail(teamId) {
    try {
        currentTeamId = teamId;
        
        // 查找团队数据
        const team = teamsData.find(t => t.id === teamId);
        if (!team) {
            showNotification('团队信息不存在', 'error');
            return;
        }
        
        // 隐藏团队列表页面
        const teamListPage = document.getElementById('team-managementPage');
        if (teamListPage) {
            teamListPage.style.display = 'none';
        }
        
        // 显示团队详情页面
        const teamDetailPage = document.getElementById('teamDetailPage');
        if (teamDetailPage) {
            teamDetailPage.style.display = 'block';
        }
        
        // 更新团队详情信息
        updateTeamDetailInfo(team);
        
        // 默认显示成员列表
        switchTeamTab('members');
        
    } catch (error) {
        console.error('查看团队详情失败:', error);
        showNotification('查看团队详情失败', 'error');
    }
}

/**
 * 返回团队列表
 */
function backToTeamList() {
    // 隐藏团队详情页面
    const teamDetailPage = document.getElementById('teamDetailPage');
    if (teamDetailPage) {
        teamDetailPage.style.display = 'none';
    }
    
    // 显示团队列表页面
    const teamListPage = document.getElementById('team-managementPage');
    if (teamListPage) {
        teamListPage.style.display = 'block';
    }
    
    currentTeamId = null;
}

/**
 * 更新团队详情信息
 */
function updateTeamDetailInfo(team) {
    const titleEl = document.getElementById('teamDetailTitle');
    const avatarEl = document.getElementById('teamAvatarLarge');
    const nameEl = document.getElementById('teamNameLarge');
    const descEl = document.getElementById('teamDescriptionLarge');
    const leaderEl = document.getElementById('teamLeaderLarge');
    const memberCountEl = document.getElementById('teamMemberCountLarge');
    const createDateEl = document.getElementById('teamCreateDateLarge');
    const statusEl = document.getElementById('teamStatusLarge');
    
    if (titleEl) titleEl.textContent = team.name;
    if (avatarEl) avatarEl.textContent = '👥';
    if (nameEl) nameEl.textContent = team.name;
    if (descEl) descEl.textContent = team.description;
    if (leaderEl) leaderEl.textContent = team.leader;
    if (memberCountEl) memberCountEl.textContent = team.memberCount;
    if (createDateEl) createDateEl.textContent = team.createDate;
    if (statusEl) {
        statusEl.textContent = team.status === 'active' ? '活跃' : '非活跃';
        statusEl.className = `status-badge ${team.status}`;
    }
}

/**
 * 切换团队详情标签页
 */
function switchTeamTab(tabName) {
    // 移除所有活动状态
    document.querySelectorAll('#teamDetailPage .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#teamDetailPage .tab-content').forEach(content => content.classList.remove('active'));
    
    // 激活选中的标签
    const activeBtn = event?.currentTarget;
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    const targetContent = document.getElementById(`team${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // 根据标签页加载相应数据
    switch (tabName) {
        case 'members':
            loadTeamMembers(currentTeamId);
            break;
        case 'timesheet':
            loadTeamTimesheet();
            break;
        case 'projects':
            loadTeamProjects();
            break;
    }
}

/**
 * 加载团队成员
 */
function loadTeamMembers(teamId) {
    try {
        const members = membersData[teamId] || [];
        renderTeamMembers(members);
    } catch (error) {
        console.error('加载团队成员失败:', error);
        showNotification('加载团队成员失败', 'error');
    }
}

/**
 * 渲染团队成员
 */
function renderTeamMembers(members) {
    const membersTableBody = document.getElementById('membersTableBody');
    if (!membersTableBody) return;
    
    if (members.length === 0) {
        membersTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <div style="font-size: 48px; margin-bottom: 16px;">👤</div>
                    <div>暂无成员数据</div>
                </td>
            </tr>
        `;
        return;
    }
    
    membersTableBody.innerHTML = members.map(member => `
        <tr>
            <td>
                <div class="member-avatar-small">${member.avatar}</div>
            </td>
            <td>
                <div style="font-weight: 600; color: #2c3e50;">${member.name}</div>
            </td>
            <td>
                <div style="color: #7f8c8d; font-size: 12px;">${member.role}</div>
            </td>
            <td>
                <div style="font-weight: 600; color: #2c3e50;">${member.hours}h</div>
            </td>
            <td>
                <span class="status-badge ${member.status}">${member.status === 'active' ? '在线' : '离线'}</span>
            </td>
            <td>
                <button class="btn btn-small" onclick="viewMemberDetail(${member.id})">查看</button>
            </td>
        </tr>
    `).join('');
}

/**
 * 加载团队工时汇总
 */
function loadTeamTimesheet() {
    try {
        const timesheet = timesheetData[currentTeamId];
        if (!timesheet) {
            showNotification('工时数据不存在', 'error');
            return;
        }
        
        renderTeamTimesheet(timesheet);
    } catch (error) {
        console.error('加载团队工时汇总失败:', error);
        showNotification('加载团队工时汇总失败', 'error');
    }
}

/**
 * 渲染团队工时汇总
 */
function renderTeamTimesheet(data) {
    // 更新统计卡片
    const totalHoursEl = document.getElementById('totalHours');
    const totalDaysEl = document.getElementById('totalDays');
    const avgHoursPerDayEl = document.getElementById('avgHoursPerDay');
    const fillRateEl = document.getElementById('fillRate');
    
    if (totalHoursEl) totalHoursEl.textContent = data.summary.totalHours;
    if (totalDaysEl) totalDaysEl.textContent = data.summary.totalDays;
    if (avgHoursPerDayEl) avgHoursPerDayEl.textContent = data.summary.avgHoursPerDay;
    if (fillRateEl) fillRateEl.textContent = data.summary.fillRate + '%';
    
    // 渲染工时表格
    const timesheetTableBody = document.getElementById('timesheetTableBody');
    if (!timesheetTableBody) return;
    
    timesheetTableBody.innerHTML = data.details.map(item => `
        <tr>
            <td style="font-weight: 600; color: #2c3e50;">${item.name}</td>
            <td style="color: #7f8c8d;">${item.project}</td>
            <td style="font-weight: 600; color: #2c3e50;">${item.hours}h</td>
            <td style="color: #7f8c8d;">${item.days}天</td>
            <td>
                <span class="status-badge ${item.status === '已完成' ? 'completed' : 'active'}">
                    ${item.status}
                </span>
            </td>
            <td style="color: #7f8c8d; font-size: 12px;">${item.lastUpdate}</td>
        </tr>
    `).join('');
}

/**
 * 加载团队项目
 */
function loadTeamProjects() {
    try {
        const projects = projectsData[currentTeamId] || [];
        renderTeamProjects(projects);
    } catch (error) {
        console.error('加载团队项目失败:', error);
        showNotification('加载团队项目失败', 'error');
    }
}

/**
 * 渲染团队项目
 */
function renderTeamProjects(projects) {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;
    
    if (projects.length === 0) {
        projectsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #7f8c8d;">
                <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
                <div>暂无项目数据</div>
            </div>
        `;
        return;
    }
    
    projectsGrid.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-header">
                <div>
                    <div class="project-name">${project.name}</div>
                    <div class="project-code">${project.code}</div>
                </div>
                <span class="project-status ${project.status}">
                    ${project.status === 'active' ? '进行中' : '已完成'}
                </span>
            </div>
            <div class="project-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${project.progress}%"></div>
                </div>
                <div class="progress-text">${project.progress}%</div>
            </div>
        </div>
    `).join('');
}

/**
 * 搜索团队
 */
function searchTeams() {
    const searchTerm = document.getElementById('teamSearch').value.toLowerCase();
    const teamCards = document.querySelectorAll('#team-managementPage .team-card');
    
    teamCards.forEach(card => {
        const teamName = card.querySelector('h4').textContent.toLowerCase();
        const teamDesc = card.querySelector('p').textContent.toLowerCase();
        
        if (teamName.includes(searchTerm) || teamDesc.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * 筛选团队
 */
function filterTeams() {
    const filterValue = document.getElementById('teamFilter').value;
    const teamCards = document.querySelectorAll('#team-managementPage .team-card');
    
    teamCards.forEach(card => {
        const statusElement = card.querySelector('.team-status');
        const status = statusElement ? statusElement.textContent.trim() : '';
        
        if (!filterValue || 
            (filterValue === 'active' && status === '活跃') ||
            (filterValue === 'inactive' && status === '非活跃')) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * 显示新建团队表单
 */
function showTeamForm() {
    showNotification('新建团队功能开发中', 'info');
}

/**
 * 加载团队列表
 */
function loadTeamList() {
    showNotification('团队列表已刷新', 'success');
}

/**
 * 添加团队成员
 */
function addTeamMember() {
    showNotification('添加成员功能开发中', 'info');
}

/**
 * 编辑团队
 */
function editTeam() {
    showNotification('编辑团队功能开发中', 'info');
}

/**
 * 分配项目
 */
function assignProject() {
    showNotification('分配项目功能开发中', 'info');
}

/**
 * 导出团队数据
 */
function exportTeamData() {
    showNotification('导出功能开发中', 'info');
}

/**
 * 导出团队工时
 */
function exportTeamTimesheet() {
    showNotification('导出工时报表功能开发中', 'info');
}

/**
 * 查看成员详情
 */
function viewMemberDetail(memberId) {
    showNotification(`查看成员 ${memberId} 详情功能开发中`, 'info');
}

/**
 * 初始化工时表页面
 */
function initializeTeamManagementPage() {
    console.log('Initializing Team Management Page...');
    console.log('团队管理页面已加载');
}

// 将函数暴露到全局作用域
window.viewTeamDetail = viewTeamDetail;
window.backToTeamList = backToTeamList;
window.switchTeamTab = switchTeamTab;
window.addTeamMember = addTeamMember;
window.editTeam = editTeam;
window.assignProject = assignProject;
window.exportTeamData = exportTeamData;
window.exportTeamTimesheet = exportTeamTimesheet;
window.viewMemberDetail = viewMemberDetail;
window.searchTeams = searchTeams;
window.filterTeams = filterTeams;
window.showTeamForm = showTeamForm;
window.loadTeamList = loadTeamList;
window.initializeTeamManagementPage = initializeTeamManagementPage;
