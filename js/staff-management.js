// 人员管理相关功能
console.log('staff-management.js loaded successfully');
const API_BASE_URL = 'http://127.0.0.1:5001';

// 全局变量
let currentEmployeePage = 1;
let totalEmployeePages = 1;
let employeeSearchTerm = '';
let currentEmployeeType = 'all';
let currentDepartment = '';

// 页面初始化（绑定到全局，确保 main.js 可访问）
window.initializeStaffManagementPage = function() {
    console.log('Staff management page initializer called');
    loadEmployeeList();
    loadDepartments();
};

// 加载员工列表
async function loadEmployeeList(page = 1) {
    console.log('Loading employee list for page:', page);
    
    try {
        const params = new URLSearchParams({
            page: page,
            per_page: 10,
            search: employeeSearchTerm
        });
        
        const response = await fetch(`${API_BASE_URL}/api/employees?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received employee data:', data);
        
        updateEmployeeListTable(data.employees);
        updateEmployeePagination(data.total, data.page, data.pages);
        
        currentEmployeePage = data.page;
        totalEmployeePages = data.pages;
        
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
                    <button class="action-btn board-btn" onclick="openTimesheetBoard(${employee.id})">报工看板</button>
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
    
    // 生成页码按钮
    updateEmployeePaginationPages(page, pages);
}

// 更新分页页码
function updateEmployeePaginationPages(currentPage, totalPages) {
    const paginationPages = document.getElementById('employee-pagination-pages');
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
        pagesHtml += `<button class="pagination-btn ${activeClass}" onclick="changeEmployeePage(${i})">${i}</button>`;
    }
    
    paginationPages.innerHTML = pagesHtml;
}

// 切换员工页面
function changeEmployeePage(page) {
    if (page < 1 || page > totalEmployeePages) return;
    loadEmployeeList(page);
}

// 搜索员工
function searchEmployees() {
    const searchInput = document.getElementById('employeeSearch');
    if (searchInput) {
        employeeSearchTerm = searchInput.value.trim();
        loadEmployeeList(1);
    }
}

// 加载部门列表
async function loadDepartments() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/departments`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const departments = await response.json();
        console.log('Received departments:', departments);
        
        const departmentSelect = document.getElementById('employeeDepartment');
        if (departmentSelect) {
            // 清空现有选项（保留第一个空选项）
            departmentSelect.innerHTML = '<option value="">请选择部门</option>';
            
            // 添加部门选项
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                departmentSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading departments:', error);
        showNotification('加载部门列表失败: ' + error.message, 'error');
    }
}

// 编辑员工 - 只显示信息，不做修改
function editEmployee(employeeId) {
    showNotification('编辑功能暂未开放', 'info');
}

// 删除员工 - 只显示信息，不做删除
function deleteEmployee(employeeId) {
    showNotification('删除功能暂未开放', 'info');
}

// 报工看板 - 新标签页打开
function openTimesheetBoard(employeeId) {
    console.log('打开报工看板:', employeeId);
    window.open('http://10.10.201.76:8100/#/de-link/PLgPsH9r', '_blank');
}

// 按员工类型筛选
function filterByType(type) {
    currentEmployeeType = type;
    currentEmployeePage = 1;
    
    // 更新按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    // 重新加载数据
    loadEmployeeList();
}

// 按部门筛选
function filterByDepartment() {
    const select = document.getElementById('departmentFilter');
    currentDepartment = select.value;
    currentEmployeePage = 1;
    
    // 重新加载数据
    loadEmployeeList();
}

// 搜索员工
function searchEmployees() {
    const searchInput = document.getElementById('employeeSearch');
    employeeSearchTerm = searchInput.value.trim();
    currentEmployeePage = 1;
    
    // 重新加载数据
    loadEmployeeList();
}

// 将新函数暴露到全局作用域
window.filterByType = filterByType;
window.filterByDepartment = filterByDepartment;
window.searchEmployees = searchEmployees;
window.openTimesheetBoard = openTimesheetBoard;
