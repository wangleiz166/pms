// d:\code\pms_modular\pms\js\project-management.js

// 项目管理相关变量
let currentProjectPage = 1;
let projectData = [];
let filteredProjects = [];
const PROJECTS_PER_PAGE = 10;
// 员工映射缓存，用于在后端未返回项目经理姓名时回退
let employeeIdToName = null;
let rolesCache = null;
let employeesCache = null;
let projectManagersCache = null;
// 统一使用全局 BASE，避免重复声明冲突
// 避免与其他脚本的全局常量冲突，使用函数获取基址
function getApiBase() {
    if (window.API_BASE_URL) {
        return window.API_BASE_URL;
    }
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // 判断是否为域名（包含点号且不是IP地址）
    const isDomain = hostname.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname);
    
    if (isDomain) {
        // 域名时不添加端口号
        return `${protocol}//${hostname}`;
    } else {
        // IP地址或localhost时添加端口号
        return `${protocol}//${hostname}:5001`;
    }
}

// 初始化项目管理页面
async function initializeProjectManagementPage() {
    // 确保DOM元素存在后再绑定事件和加载数据
    // 使用短暂的延时确保DOM渲染完成
    setTimeout(async () => {
        // 绑定按钮与控件事件（替代内联onclick）
        const addBtn = document.getElementById('btn-add-project');
        if (addBtn) addBtn.onclick = () => showProjectForm();

        const refreshBtn = document.getElementById('btn-refresh-projects');
        if (refreshBtn) refreshBtn.onclick = () => loadProjectList();

        const searchBtn = document.getElementById('btn-search-projects');
        if (searchBtn) searchBtn.onclick = () => searchProjects();

        const typeFilter = document.getElementById('projectTypeFilter');
        if (typeFilter) typeFilter.onchange = () => filterProjectType();

        const prevBtn = document.getElementById('project-prev-btn');
        if (prevBtn) prevBtn.onclick = () => changeProjectPage('prev');

        const nextBtn = document.getElementById('project-next-btn');
        if (nextBtn) nextBtn.onclick = () => changeProjectPage('next');

        const modalCloseX = document.getElementById('btn-project-modal-x');
        if (modalCloseX) modalCloseX.onclick = () => closeProjectModal();

        const modalCancel = document.getElementById('btn-project-cancel');
        if (modalCancel) modalCancel.onclick = () => closeProjectModal();

        const modalSave = document.getElementById('btn-project-save');
        if (modalSave) modalSave.onclick = () => saveProject();

        await loadProjectList();
        bindProjectPageEvents();
    }, 100);
}

// 绑定事件
function bindProjectPageEvents() {
    // 搜索框事件
    const searchInput = document.getElementById('projectSearch');
    if (searchInput) {
        searchInput.onkeyup = searchProjects;
    }

    // 状态筛选事件
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.onchange = filterProjects;
    }
}

// 加载项目列表
async function loadProjectList() {
    const API_BASE_URL = getApiBase();
    console.log(`[DEBUG] loadProjectList 开始 - 页码: ${currentProjectPage}, API_BASE_URL: ${API_BASE_URL}`);
    console.log(`[DEBUG] 请求URL: ${API_BASE_URL}/api/projects/detailed?page=${currentProjectPage}&limit=${PROJECTS_PER_PAGE}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/detailed?page=${currentProjectPage}&limit=${PROJECTS_PER_PAGE}`);
        console.log(`[DEBUG] 响应状态: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('[DEBUG] 接收到的原始数据:', data);
        console.log('[DEBUG] data.projects:', data.projects);
        console.log('[DEBUG] data.projects 长度:', data.projects ? data.projects.length : 'undefined');

        projectData = data.projects || [];
        filteredProjects = projectData;
        
        console.log(`[DEBUG] projectData 设置后长度: ${projectData.length}`);
        console.log(`[DEBUG] filteredProjects 长度: ${filteredProjects.length}`);
        
        // 如果缺少项目经理姓名但存在ID，则尝试构建员工映射后再渲染
        const needManagerEnrich = projectData.some(p => !p.project_manager_name && p.project_manager_id);
        if (needManagerEnrich) {
            await ensureEmployeeMap();
        }
        
        updateProjectListTable(filteredProjects);
        updateProjectStats(projectData); // 应该用全部数据更新统计信息
        updateProjectPagination(data.total, data.page, data.pages);

    } catch (error) {
        console.error('[DEBUG] 加载项目列表失败:', error);
        const tbody = document.getElementById('project-list-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="error-message">数据加载失败: ${error.message}</td></tr>`;
        }
    }
}

// 确保员工映射已加载（一次性加载到内存）
async function ensureEmployeeMap() {
    if (employeeIdToName) return;
    try {
        const API_BASE_URL = getApiBase();
        // 拉取尽可能多的员工，避免多次请求（后台有分页支持）
        const resp = await fetch(`${API_BASE_URL}/api/employees?page=1&per_page=1000`);
        if (!resp.ok) return;
        const data = await resp.json();
        const employees = data.employees || [];
        employeeIdToName = employees.reduce((acc, emp) => {
            acc[emp.id] = emp.name;
            return acc;
        }, {});
    } catch (e) {
        console.warn('加载员工映射失败，用于填充项目经理姓名的回退将跳过。', e);
    }
}

// 获取项目类型文本
function getProjectTypeText(typeValue) {
    const typeMap = {
        '1': '售前类',
        '2': '交付类', 
        '3': '运维类',
        '4': '内部项目'
    };
    return typeMap[typeValue] || '交付类';
}

// 更新项目列表表格
function updateProjectListTable(projects) {
    const tbody = document.getElementById('project-list-tbody');
    
    if (!tbody) {
        // 页面未加载完成，延迟重试一次
        setTimeout(() => {
            const retryTbody = document.getElementById('project-list-tbody');
            if (retryTbody && projects) {
                updateProjectListTable(projects);
            }
        }, 100);
        return;
    }

    if (projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">没有找到项目</td></tr>';
        return;
    }

    // 计算序号起始值：根据当前页码计算
    // 第1页: (1-1)*10+1 = 1
    // 第2页: (2-1)*10+1 = 11
    // 第3页: (3-1)*10+1 = 21
    const startIndex = (currentProjectPage - 1) * PROJECTS_PER_PAGE + 1;

    tbody.innerHTML = projects.map((project, index) => {
        const code = project.code || project.project_code || 'N/A';
        const fullName = project.name || project.project_name || 'N/A';
        const shortName = fullName.length > 20 ? (fullName.slice(0, 20) + '...') : fullName;
        const typeValue = project.type || project.project_type || '2';
        const typeText = getProjectTypeText(typeValue);
        const pmName = project.project_manager_name || (employeeIdToName && project.project_manager_id ? (employeeIdToName[project.project_manager_id] || '—') : '—');
        return `
        <tr>
            <td style="text-align: center;">${startIndex + index}</td>
            <td>${code}</td>
            <td title="${fullName}">${shortName}</td>
            <td>${pmName}</td>
            <td>${typeText}</td>
            <td>${project.total_budget_days != null ? project.total_budget_days : '—'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" onclick="viewProjectMembers(${project.id})">项目人员</button>
                    <button class="action-btn edit-btn" onclick="editProject(${project.id})">编辑</button>
                    <button class="action-btn delete-btn" onclick="deleteProject(${project.id})">删除</button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

// 更新项目统计
function updateProjectStats(projects) {
    // 统计功能已移除，因为页面简化了
    console.log('Project stats update called, but stats cards were removed from UI');
}

// 更新分页
function updateProjectPagination(totalItems, currentPage, totalPages) {
    const paginationInfo = document.getElementById('project-pagination-info');
    const paginationControls = document.getElementById('project-pagination-pages');
    const prevBtn = document.getElementById('project-prev-btn');
    const nextBtn = document.getElementById('project-next-btn');

    if (!paginationInfo || !paginationControls || !prevBtn || !nextBtn) return;

    if (totalItems === 0) {
        paginationInfo.textContent = `显示第 0-0 条，共 0 条记录`;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        paginationControls.innerHTML = '';
        return;
    }

    const startItem = (currentPage - 1) * PROJECTS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * PROJECTS_PER_PAGE, totalItems);

    paginationInfo.textContent = `显示第 ${startItem}-${endItem} 条，共 ${totalItems} 条记录`;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    // 生成页码按钮 - 使用与员工列表一致的逻辑
    updateProjectPaginationPages(currentPage, totalPages);
}

// 更新分页页码
function updateProjectPaginationPages(currentPage, totalPages) {
    const paginationPages = document.getElementById('project-pagination-pages');
    if (!paginationPages) return;
    
    let pagesHtml = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        pagesHtml += `<button class="pagination-btn ${activeClass}" onclick="changeProjectPage(${i})">${i}</button>`;
    }
    
    paginationPages.innerHTML = pagesHtml;
}

// 刷新项目列表
function refreshProjectList() {
    console.log('Refreshing project list');
    loadProjectList();
}

// 搜索项目
function searchProjects() {
    // 如果页面还未加载完成，静默返回
    const tbody = document.getElementById('project-list-tbody');
    if (!tbody) {
        return;  // 静默返回
    }
    
    const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const typeFilter = document.getElementById('projectTypeFilter')?.value || '';
    filterAndDisplayProjects(searchTerm, statusFilter, typeFilter);
}

// 筛选项目
function filterProjects() {
    // 如果页面还未加载完成，静默返回
    const tbody = document.getElementById('project-list-tbody');
    if (!tbody) {
        return;  // 静默返回，不输出日志避免干扰
    }
    
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const typeFilter = document.getElementById('projectTypeFilter')?.value || '';
    filterAndDisplayProjects(document.getElementById('projectSearch').value.toLowerCase(), statusFilter, typeFilter);
}

// 项目类型筛选
function filterProjectType() {
    // 如果页面还未加载完成，静默返回
    const tbody = document.getElementById('project-list-tbody');
    if (!tbody) {
        return;  // 静默返回
    }
    
    const searchTerm = document.getElementById('projectSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const typeFilter = document.getElementById('projectTypeFilter')?.value || '';

    // 当切回“全部”时，直接刷新整表，避免因本地 filteredProjects 残留导致的数据缺失
    if (typeFilter === '' || typeFilter === 'all') {
        currentProjectPage = 1;
        loadProjectList();
        return;
    }

    filterAndDisplayProjects(searchTerm, statusFilter, typeFilter);
}

// 统一的筛选和显示函数
function filterAndDisplayProjects(searchTerm, statusFilter, typeFilter) {
    filteredProjects = projectData.filter(project => {
        const name = project.project_name || '';
        const code = project.project_code || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm) || code.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || project.status === statusFilter;
        const matchesType = !typeFilter || project.project_type == typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });
    
    // 更新表格内容
    updateProjectListTable(filteredProjects);

    // 当筛选结果不满一页时，禁用分页切换，避免出现“只有一条记录还能切到第二页”的问题
    try {
        const totalItems = filteredProjects.length;
        if (totalItems <= PROJECTS_PER_PAGE) {
            const paginationInfo = document.getElementById('project-pagination-info');
            const prevBtn = document.getElementById('project-prev-btn');
            const nextBtn = document.getElementById('project-next-btn');
            const paginationPages = document.getElementById('project-pagination-pages');

            if (paginationInfo) {
                const startItem = totalItems === 0 ? 0 : 1;
                const endItem = totalItems;
                paginationInfo.textContent = `显示第 ${startItem}-${endItem} 条，共 ${totalItems} 条记录`;
            }
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            if (paginationPages) {
                paginationPages.innerHTML = `<button class="pagination-btn active">1</button>`;
            }
        }
    } catch (e) {
        console.warn('[项目管理] 更新筛选后的分页状态失败:', e);
    }
}

// 分页相关函数
function changeProjectPage(page) {
    if (page === 'prev') {
        // 上一页
        currentProjectPage = Math.max(1, currentProjectPage - 1);
    } else if (page === 'next') {
        // 下一页
        currentProjectPage++;
    } else if (typeof page === 'number' && page > 0) {
        // 跳转到指定页
        currentProjectPage = page;
    }
    console.log('[分页] 切换到页码:', currentProjectPage);
    loadProjectList();
}

// 编辑项目
function editProject(projectId) {
    showProjectForm(projectId);
}

// 显示项目表单
async function showProjectForm(projectId = null) {
    console.log('showProjectForm 函数被调用，项目ID:', projectId);
    const modal = document.getElementById('projectModal');
    if (!modal) return;

    // 统一居中显示，和系统其它弹窗样式一致
    modal.classList.add('show');
    modal.style.display = 'flex';
    const form = document.getElementById('projectForm');
    form.reset();
    
    // 设置表单的 data-id 属性以跟踪正在编辑的项目
    form.dataset.projectId = projectId ? projectId : '';

    // 控制年度项目勾选框的显示/隐藏
    const annualCheckboxGroup = document.querySelector('#isAnnualProject').parentElement.parentElement;
    if (projectId) {
        // 编辑模式：隐藏年度项目勾选框
        annualCheckboxGroup.style.display = 'none';
    } else {
        // 新增模式：显示年度项目勾选框
        annualCheckboxGroup.style.display = 'block';
    }

    // 填充项目经理下拉框
    await populateProjectManagerSelect();

    if (projectId) {
        // 编辑模式 - 在填充下拉框后设置值
        const project = projectData.find(p => p.id === projectId);
        if (project) {
            const nameEl = document.getElementById('projectName');
            if (nameEl) nameEl.value = project.project_name || '';
            const typeEl = document.getElementById('projectType');
            if (typeEl) typeEl.value = project.project_type || '2';
            const managerEl = document.getElementById('projectManager');
            if (managerEl) managerEl.value = project.project_manager_id || '';
            const categoryEl = document.getElementById('projectCategory');
            if (categoryEl) categoryEl.value = project.project_category || '';
            const bu = document.getElementById('businessUnitCode');
            if (bu) bu.value = project.business_unit_code || '';
            const cdc = document.getElementById('clientOrDeptCode');
            if (cdc) cdc.value = project.client_or_dept_code || '';
        }
    } else {
        // 新增模式 - 设置默认值
        const typeEl = document.getElementById('projectType');
        if (typeEl) typeEl.value = '2'; // 默认选择交付类
    } 
}

// 打开项目成员管理弹窗
function viewProjectMembers(projectId) {
    const modal = document.getElementById('projectMembersModal');
    if (!modal) return;
    modal.classList.add('show');
    modal.style.display = 'flex';
    // 记住当前项目ID
    modal.dataset.projectId = projectId || '';
    // 初始化下拉数据
    populateProjectMemberSelects();
    // 加载成员列表
    loadProjectMembersList(projectId);
}

function closeProjectMembersModal() {
    const modal = document.getElementById('projectMembersModal');
    if (!modal) return;
    
    // 退出编辑状态
    exitEditProjectMember();
    
    modal.classList.remove('show');
    modal.style.display = 'none';
    
    // 保存当前筛选状态
    const searchTerm = document.getElementById('projectSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const typeFilter = document.getElementById('projectTypeFilter')?.value || '';
    const hasFilters = searchTerm || statusFilter || typeFilter;
    
    // 关闭时刷新项目列表，更新预算人天总数
    loadProjectList().then(() => {
        // 如果之前有筛选条件，重新应用筛选
        if (hasFilters) {
            console.log('[项目成员弹窗关闭] 重新应用筛选条件:', { searchTerm, statusFilter, typeFilter });
            filterAndDisplayProjects(searchTerm, statusFilter, typeFilter);
        }
    });
}

async function populateProjectMemberSelects() {
    await Promise.all([ensureRolesCache(), ensureEmployeesCache()]);
    
    // 项目角色 - 写死的6种角色
    const roleSel = document.getElementById('pmProjectRole');
    if (roleSel) {
        const projectRoles = [
            '项目经理',
            '初级开发工程师', 
            '中级开发工程师',
            '高级开发工程师',
            '测试工程师',
            '咨询顾问'
        ];
        
        roleSel.innerHTML = '<option value="">请选择项目角色</option>' +
            projectRoles.map(role => `<option value="${role}">${role}</option>`).join('');
    }
    
    // 成员
    const memberSel = document.getElementById('pmMember');
    if (memberSel) {
        memberSel.innerHTML = '<option value="">请选择成员</option>' +
            (employeesCache || []).map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    }
}

// 填充项目经理下拉框
async function populateProjectManagerSelect() {
    const API_BASE_URL = getApiBase();
    console.log('[项目经理下拉框] 开始加载项目经理列表');
    
    try {
        // 每次都从接口获取最新数据，确保数据是最新的
        const response = await fetch(`${API_BASE_URL}/api/employees/project-managers`);
        console.log('[项目经理下拉框] 接口响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            projectManagersCache = data;
            console.log('[项目经理下拉框] 获取到的项目经理数量:', data.length);
        } else {
            console.error('[项目经理下拉框] 接口调用失败，状态码:', response.status);
            // 如果接口失败但有缓存，使用缓存
            if (!projectManagersCache) {
                throw new Error('获取项目经理列表失败');
            }
        }
    } catch (error) {
        console.error('[项目经理下拉框] 获取项目经理失败:', error);
        // 如果失败且没有缓存，显示提示
        if (!projectManagersCache) {
            if (typeof showNotification === 'function') {
                showNotification('获取项目经理列表失败', 'error');
            }
            return;
        }
    }
    
    // 填充下拉框
    const managerSelect = document.getElementById('projectManager');
    if (managerSelect && projectManagersCache) {
        managerSelect.innerHTML = '<option value="">请选择项目经理</option>' +
            projectManagersCache.map(manager => `<option value="${manager.id}">${manager.name}</option>`).join('');
        console.log('[项目经理下拉框] 下拉框已填充，选项数量:', projectManagersCache.length);
    } else {
        console.warn('[项目经理下拉框] 下拉框元素未找到或数据为空');
    }
}

async function loadProjectMembersList(projectId) {
    try {
        const API_BASE_URL = getApiBase();
        const resp = await fetch(`${API_BASE_URL}/api/projects/${projectId}/members`);
        if (!resp.ok) throw new Error('加载项目成员失败');
        const data = await resp.json();
        const list = data.members || [];
        const tbody = document.getElementById('projectMembersList');
        if (!tbody) return;
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">暂无成员数据</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(m => `
            <tr>
                <td>${m.role_name || '-'}</td>
                <td>${m.employee_name || '-'}</td>
                <td>${m.start_date ? m.start_date.substring(0,10) : '-'}</td>
                <td>${m.end_date ? m.end_date.substring(0,10) : '-'}</td>
                <td>${m.budget_days ?? '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="startEditProjectMember(${projectId}, ${m.id})">编辑</button>
                        <button class="action-btn delete-btn" onclick="removeProjectMember(${projectId}, ${m.id})">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.warn(e);
    }
}

async function addProjectMember() {
    const modal = document.getElementById('projectMembersModal');
    if (!modal) return;
    const projectId = modal.dataset.projectId;
    const payload = {
        role_name: document.getElementById('pmProjectRole')?.value || null,
        employee_id: document.getElementById('pmMember')?.value || null,
        start_date: document.getElementById('pmEntryDate')?.value || null,
        end_date: document.getElementById('pmExitDate')?.value || null,
        budget_days: document.getElementById('pmBudgetDays')?.value || null,
    };
    if (!payload.employee_id) {
        if (typeof showNotification === 'function') showNotification('请选择成员', 'warning');
        return;
    }
    try {
        const API_BASE_URL = getApiBase();
        // 如果处于编辑模式则调用更新接口
        const editingId = modal.dataset.editingMemberId;
        const isEditing = !!editingId;
        const url = isEditing
            ? `${API_BASE_URL}/api/projects/${projectId}/members/${editingId}`
            : `${API_BASE_URL}/api/projects/${projectId}/members`;
        const method = isEditing ? 'PUT' : 'POST';
        const resp = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.message || '添加失败');
        }
        if (typeof showNotification === 'function') showNotification(isEditing ? '成员更新成功' : '成员添加成功', 'success');
        exitEditProjectMember();
        loadProjectMembersList(projectId);
        // 刷新项目列表以更新预算人天总数
        loadProjectList();
    } catch (e) {
        if (typeof showNotification === 'function') showNotification(e.message || '添加失败', 'error');
    }
}

function clearProjectMemberForm() {
    const ids = ['pmProjectRole', 'pmMember', 'pmEntryDate', 'pmExitDate', 'pmBudgetDays'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

async function removeProjectMember(projectId, memberId) {
    if (!confirm('确定删除该成员吗？')) return;
    try {
        const API_BASE_URL = getApiBase();
        const resp = await fetch(`${API_BASE_URL}/api/projects/${projectId}/members/${memberId}`, { method: 'DELETE' });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.message || '删除失败');
        }
        if (typeof showNotification === 'function') showNotification('删除成功', 'success');
        
        // 退出编辑状态（如果正在编辑被删除的成员）
        exitEditProjectMember();
        
        loadProjectMembersList(projectId);
        // 刷新项目列表以更新预算人天总数
        loadProjectList();
    } catch (e) {
        if (typeof showNotification === 'function') showNotification(e.message || '删除失败', 'error');
    }
}

async function startEditProjectMember(projectId, memberId) {
    const modal = document.getElementById('projectMembersModal');
    if (!modal) return;
    
    modal.dataset.editingMemberId = memberId;
    const title = document.getElementById('projectMembersTitle');
    if (title) title.textContent = '编辑项目成员';
    
    try {
        // 从后端获取成员的完整数据
        const API_BASE_URL = getApiBase();
        const resp = await fetch(`${API_BASE_URL}/api/projects/${projectId}/members`);
        if (!resp.ok) throw new Error('加载成员数据失败');
        
        const data = await resp.json();
        const members = data.members || [];
        const member = members.find(m => m.id == memberId);
        
        if (!member) {
            console.error('未找到成员数据:', memberId);
            return;
        }
        
        console.log('编辑成员数据:', member);
        
        // 填充表单
        const roleSelect = document.getElementById('pmProjectRole');
        const memberSelect = document.getElementById('pmMember');
        const entryEl = document.getElementById('pmEntryDate');
        const exitEl = document.getElementById('pmExitDate');
        const budgetEl = document.getElementById('pmBudgetDays');
        
        // 设置项目角色 - 使用角色名称而不是ID
        if (roleSelect && member.role_name) {
            roleSelect.value = member.role_name;
        }
        
        // 设置项目成员
        if (memberSelect && member.employee_id) {
            memberSelect.value = member.employee_id;
        }
        
        // 设置日期和预算
        if (entryEl && member.start_date) {
            entryEl.value = member.start_date.substring(0, 10);
        }
        if (exitEl && member.end_date) {
            exitEl.value = member.end_date.substring(0, 10);
        }
        if (budgetEl && member.budget_days !== null && member.budget_days !== undefined) {
            budgetEl.value = member.budget_days;
        }
        
        // 保存按钮文字改为"保存修改"
        const addBtn = document.querySelector(".form-actions .btn.btn-primary[onclick='addProjectMember()']");
        if (addBtn) addBtn.textContent = '保存修改';
        
    } catch (e) {
        console.error('加载成员数据失败:', e);
        if (typeof showNotification === 'function') {
            showNotification('加载成员数据失败', 'error');
        }
    }
}

function exitEditProjectMember() {
    const modal = document.getElementById('projectMembersModal');
    if (!modal) return;
    delete modal.dataset.editingMemberId;
    const title = document.getElementById('projectMembersTitle');
    if (title) title.textContent = '项目成员管理';
    clearProjectMemberForm();
    const addBtn = document.querySelector(".form-actions .btn.btn-primary[onclick='addProjectMember()']");
    if (addBtn) addBtn.textContent = '添加成员';
}

async function ensureRolesCache() {
    if (rolesCache) return;
    try {
        const API_BASE_URL = getApiBase();
        const resp = await fetch(`${API_BASE_URL}/api/roles?page=1&per_page=100`, {
            credentials: 'include'
        });
        if (!resp.ok) return;
        const data = await resp.json();
        // 适配新的API返回格式 {items: [...], pagination: {...}}
        rolesCache = data.items || data.roles || (Array.isArray(data) ? data : []);
        console.log('项目角色缓存已加载:', rolesCache);
    } catch (e) { 
        console.error('加载角色失败', e); 
        rolesCache = [];
    }
}

async function ensureEmployeesCache() {
    if (employeesCache) return;
    try {
        const API_BASE_URL = getApiBase();
        const resp = await fetch(`${API_BASE_URL}/api/employees?page=1&per_page=1000`);
        if (!resp.ok) return;
        const data = await resp.json();
        employeesCache = data.employees || [];
    } catch (e) { console.warn('加载员工失败', e); }
}

// 关闭项目表单
function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

// 保存项目
async function saveProject() {
    const form = document.getElementById('projectForm');
    if (!form.checkValidity()) {
        if(typeof showNotification === 'function') showNotification('请填写所有必填字段', 'warning');
        return;
    }

    const projectId = form.dataset.projectId;
    const formData = {
        project_name: document.getElementById('projectName')?.value || '',
        project_type: document.getElementById('projectType')?.value || '2',
        project_manager_id: document.getElementById('projectManager')?.value || '',
        project_category: document.getElementById('projectCategory')?.value || '',
        business_unit_code: document.getElementById('businessUnitCode')?.value || '',
        client_or_dept_code: document.getElementById('clientOrDeptCode')?.value || '',
        is_annual_project: document.getElementById('isAnnualProject')?.checked || false,
    };

    const API_BASE_URL = getApiBase();
    const url = projectId ? `${API_BASE_URL}/api/projects/${projectId}` : `${API_BASE_URL}/api/projects`;
    const method = projectId ? 'PUT' : 'POST';

    try {
        // 如果是编辑模式，需要获取当前项目的project_code
        let currentProject = null;
        if (projectId) {
            currentProject = projectData.find(p => p.id == projectId);
            if (!currentProject) {
                throw new Error('找不到要编辑的项目');
            }
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(method === 'POST' ? formData : {
                project_code: currentProject.project_code,
                project_name: formData.project_name,
                project_type: formData.project_type,
                project_manager_id: formData.project_manager_id,
                project_category: formData.project_category,
                business_unit_code: formData.business_unit_code,
                client_or_dept_code: formData.client_or_dept_code,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '保存失败');
        }

        if(typeof showNotification === 'function') showNotification(`项目${projectId ? '更新' : '创建'}成功`, 'success');
        closeProjectModal();
        loadProjectList(); // 刷新列表
    } catch (error) {
        console.error('Failed to save project:', error);
        if(typeof showNotification === 'function') showNotification(`操作失败: ${error.message}`, 'error');
    }
}

// 删除项目
async function deleteProject(projectId) {
    if (!confirm('确定要删除这个项目吗？此操作不可撤销。')) {
        return;
    }

    try {
        const API_BASE_URL = getApiBase();
        const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '删除失败');
        }

        if(typeof showNotification === 'function') showNotification('项目删除成功', 'success');
        loadProjectList(); // 刷新列表
    } catch (error) {
        console.error('Failed to delete project:', error);
        if(typeof showNotification === 'function') showNotification(`删除失败: ${error.message}`, 'error');
    }
}

// 将需要暴露给HTML的函数挂载到window对象
console.log('project-management.js: 开始导出函数到window对象');
window.initializeProjectManagementPage = initializeProjectManagementPage;
window.refreshProjectList = refreshProjectList;
window.searchProjects = searchProjects;
window.filterProjects = filterProjects;
window.changeProjectPage = changeProjectPage;
window.showProjectForm = showProjectForm;
window.closeProjectModal = closeProjectModal;
window.saveProject = saveProject;
window.deleteProject = deleteProject;
console.log('project-management.js: 函数导出完成，showProjectForm类型:', typeof window.showProjectForm);
