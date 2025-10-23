// 人员管理相关功能
console.log('staff-management.js loaded successfully');
// 智能获取API基址 - 域名时不添加端口号
const API_BASE_URL = (() => {
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
})();

// 全局变量
let employeeSearchTerm = '';
let currentEmployeeType = 'all';
let currentDepartment = '';
let employeePaginationManager = null;

// 初始化员工分页管理器
function initEmployeePagination() {
    employeePaginationManager = new PaginationManager({
        perPage: 10,
        
        fetchDataFunction: async (page, perPage) => {
            console.log('[员工列表] 当前筛选条件 - 搜索词:', employeeSearchTerm, '部门:', currentDepartment);
            
            const params = new URLSearchParams({
                page: page,
                per_page: perPage,
                search: employeeSearchTerm
            });
            
            // 添加部门筛选参数
            if (currentDepartment && currentDepartment !== '' && currentDepartment !== 'all') {
                params.append('department', currentDepartment);
                console.log('[员工列表] 添加department参数:', currentDepartment);
            }
            
            console.log('[员工列表] 最终请求URL:', `${API_BASE_URL}/api/employees?${params}`);
            const response = await fetch(`${API_BASE_URL}/api/employees?${params}`);
            
            if (response.ok) {
                const data = await response.json();
                return {
                    data: data.employees,
                    pagination: {
                        current_page: data.page,
                        per_page: perPage,
                        total_count: data.total,
                        total_pages: data.pages,
                        has_prev: data.page > 1,
                        has_next: data.page < data.pages
                    }
                };
            }
            throw new Error('获取员工列表失败');
        },
        
        updateTableFunction: (employees) => {
            updateEmployeeListTable(employees);
        },
        
        paginationInfoId: 'employee-pagination-info',
        paginationPagesId: 'employee-pagination-pages',
        prevButtonId: 'employee-prev-btn',
        nextButtonId: 'employee-next-btn',
        
        debug: false
    });
    
    return employeePaginationManager;
}

// 页面初始化（绑定到全局，确保 main.js 可访问）
window.initializeStaffManagementPage = function() {
    console.log('Staff management page initializer called');
    if (!employeePaginationManager) {
        initEmployeePagination();
    }
    employeePaginationManager.reset();
    loadDepartments();
};

// 兼容旧的加载员工列表函数
function loadEmployeeList(page = 1) {
    // 如果分页管理器未初始化，先初始化
    if (!employeePaginationManager) {
        initEmployeePagination();
    }
    
    if (page === 1) {
        employeePaginationManager.reset();
    } else {
        employeePaginationManager.changePage(page);
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
                    <button class="action-btn view-btn" onclick="viewEmployeeTimesheet(${employee.id}, '${employee.name}')">查看报工明细</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 兼容旧的切换页面函数
function changeEmployeePage(page) {
    // 如果分页管理器未初始化，先初始化
    if (!employeePaginationManager) {
        initEmployeePagination();
    }
    
    employeePaginationManager.changePage(page);
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

// 按员工类型筛选
function filterByType(type) {
    currentEmployeeType = type;
    
    // 更新按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    // 如果分页管理器未初始化，先初始化
    if (!employeePaginationManager) {
        initEmployeePagination();
    }
    
    // 重置到第一页并重新加载数据
    employeePaginationManager.reset();
}

// 按部门筛选（只保存值，不立即请求）
function filterByDepartment() {
    const select = document.getElementById('departmentFilter');
    currentDepartment = select.value;
    // 不再立即请求，等待用户点击搜索按钮
}

// 搜索员工（点击搜索按钮时才请求）
function searchEmployees() {
    const searchInput = document.getElementById('employeeSearch');
    employeeSearchTerm = searchInput.value.trim();
    
    // 获取部门筛选值
    const departmentSelect = document.getElementById('departmentFilter');
    if (departmentSelect) {
        currentDepartment = departmentSelect.value;
        console.log('[搜索员工] 从下拉框获取到的部门值:', currentDepartment);
    } else {
        console.warn('[搜索员工] 找不到departmentFilter元素');
    }
    
    console.log('[搜索员工] 搜索词:', employeeSearchTerm, '部门:', currentDepartment);
    
    // 如果分页管理器未初始化，先初始化
    if (!employeePaginationManager) {
        console.log('[搜索员工] 分页管理器未初始化，正在初始化...');
        initEmployeePagination();
    }
    
    // 重置到第一页并重新加载数据（会自动带上department参数）
    employeePaginationManager.reset();
}

// 将新函数暴露到全局作用域
window.filterByType = filterByType;
window.filterByDepartment = filterByDepartment;
window.searchEmployees = searchEmployees;
window.loadEmployeeList = loadEmployeeList;
window.updateEmployeeListTable = updateEmployeeListTable;
window.changeEmployeePage = changeEmployeePage;
