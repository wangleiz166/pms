// d:\code\pms_modular\pms\js\project-management.js

// 项目管理相关变量
let currentProjectPage = 1;
let projectData = [];
let filteredProjects = [];
const PROJECTS_PER_PAGE = 10;
const API_BASE_URL = 'http://127.0.0.1:5001';

// 初始化项目管理页面
async function initializeProjectManagementPage() {
    console.log('Initializing Project Management page...');
    // 确保DOM元素存在后再绑定事件和加载数据
    // 使用短暂的延时确保DOM渲染完成
    setTimeout(async () => {
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
    console.log(`Loading project list for page: ${currentProjectPage}`);
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/detailed?page=${currentProjectPage}&limit=${PROJECTS_PER_PAGE}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received project data:', data);

        projectData = data.projects || [];
        filteredProjects = projectData;
        
        updateProjectListTable(filteredProjects);
        updateProjectStats(projectData); // 应该用全部数据更新统计信息
        updateProjectPagination(data.total, data.page, data.pages);

    } catch (error) {
        console.error('Failed to load project list:', error);
        const tbody = document.getElementById('project-list-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="error-message">数据加载失败: ${error.message}</td></tr>`;
        }
    }
}

// 更新项目列表表格
function updateProjectListTable(projects) {
    const tbody = document.getElementById('project-list-tbody');
    if (!tbody) return;

    if (projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">没有找到项目</td></tr>';
        return;
    }

    // 计算序号起始值：当前页从1开始自增
    const startIndex = 1;

    tbody.innerHTML = projects.map((project, index) => {
        const code = project.code || project.project_code || 'N/A';
        const name = project.name || project.project_name || 'N/A';
        const type = project.type || project.project_type || project.status || '—';
        return `
        <tr>
            <td style="text-align: center;">${startIndex + index}</td>
            <td>${code}</td>
            <td>${name}</td>
            <td>${type}</td>
            <td>
                <div class="action-buttons">
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

    const startItem = (currentPage - 1) * PROJECTS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * PROJECTS_PER_PAGE, totalItems);

    paginationInfo.textContent = `显示第 ${startItem}-${endItem} 条，共 ${totalItems} 条记录`;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    // 生成页码按钮
    let pagesHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `<button class="pagination-page-btn ${i === currentPage ? 'active' : ''}" onclick="changeProjectPage(${i})">${i}</button>`;
    }
    paginationControls.innerHTML = pagesHtml;
}

// 刷新项目列表
function refreshProjectList() {
    console.log('Refreshing project list');
    loadProjectList();
}

// 搜索项目
function searchProjects() {
    const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
    filterAndDisplayProjects(searchTerm, document.getElementById('statusFilter').value);
}

// 筛选项目
function filterProjects() {
    const statusFilter = document.getElementById('statusFilter').value;
    filterAndDisplayProjects(document.getElementById('projectSearch').value.toLowerCase(), statusFilter);
}

// 统一的筛选和显示函数
function filterAndDisplayProjects(searchTerm, statusFilter) {
    filteredProjects = projectData.filter(project => {
        const name = project.project_name || '';
        const manager = project.project_manager || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm) || manager.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || project.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    // 注意：客户端筛选不应重新计算分页，这应该由后端完成
    // 这里我们只更新表格内容，不更新分页信息
    updateProjectListTable(filteredProjects);
}

// 分页相关函数
function changeProjectPage(page) {
    if (typeof page === 'number' && page > 0) {
        currentProjectPage = page;
    } else if (page === -1) { // 代表上一页
        currentProjectPage = Math.max(1, currentProjectPage - 1);
    } else if (page === 1) { // 代表下一页
        currentProjectPage++;
    }
    loadProjectList();
}

// 显示项目表单
function showProjectForm(projectId = null) {
    console.log('Showing project form for project ID:', projectId);
    const modal = document.getElementById('projectModal');
    if (!modal) return;

    modal.style.display = 'block';
    const form = document.getElementById('projectForm');
    form.reset();
    
    // 设置表单的 data-id 属性以跟踪正在编辑的项目
    form.dataset.projectId = projectId ? projectId : '';

    if (projectId) {
        // 编辑模式
        const project = projectData.find(p => p.id === projectId);
        if (project) {
            document.getElementById('projectName').value = project.project_name || '';
            document.getElementById('projectStatus').value = project.status || 'planning';
        }
    } 
}

// 关闭项目表单
function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) {
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
    const projectData = {
        project_name: document.getElementById('projectName').value,
        status: document.getElementById('projectStatus').value,
    };

    const url = projectId ? `${API_BASE_URL}/api/projects/${projectId}` : `${API_BASE_URL}/api/projects`;
    const method = projectId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData),
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
window.initializeProjectManagementPage = initializeProjectManagementPage;
window.refreshProjectList = refreshProjectList;
window.searchProjects = searchProjects;
window.filterProjects = filterProjects;
window.changeProjectPage = changeProjectPage;
window.showProjectForm = showProjectForm;
window.closeProjectModal = closeProjectModal;
window.saveProject = saveProject;
window.deleteProject = deleteProject;
