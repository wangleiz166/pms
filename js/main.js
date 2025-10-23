// 智能获取API基址 - 域名时不添加端口号
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

// 全局：更新审核中心数量（调用接口）
async function updateApprovalCount() {
    try {
        const apiBase = getApiBase();
        const url = `${apiBase}/api/reports/pending?page=1&per_page=1`;
        const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
        if (!response.ok) return;
        const data = await response.json();
        updateApprovalCountFromData(data);
    } catch (e) {
        // 静默失败
    }
}

function updateApprovalCountFromData(data) {
    const total = (data && data.pagination && data.pagination.total_count) ? data.pagination.total_count : 0;
    const badge = document.getElementById('approvalCount');
    if (!badge) return;
    if (total > 0) {
        badge.textContent = `(${total})`;
        badge.style.display = '';
    } else {
        badge.style.display = 'none';
    }
}

window.updateApprovalCount = updateApprovalCount;
// 项目管理系统 - 完整版JavaScript

// 全局变量声明
let currentUserPermissions = null;

// 当前活跃页面
let currentPage = 'timesheet';
let currentUser = '王磊';

// Cookie操作函数
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, days = 7) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

// ======================== 通用分页管理器 ========================
/**
 * 通用分页管理类
 * 使用方法：
 * const pagination = new PaginationManager({
 *     fetchDataFunction: async (page) => { ... }, // 获取数据的函数
 *     updateTableFunction: (data) => { ... },      // 更新表格的函数
 *     paginationInfoId: 'pagination-info',         // 分页信息元素ID
 *     paginationPagesId: 'pagination-pages',       // 页码容器元素ID
 *     prevButtonId: 'prev-btn',                    // 上一页按钮ID
 *     nextButtonId: 'next-btn'                     // 下一页按钮ID
 * });
 */
class PaginationManager {
    constructor(config) {
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalCount = 0;
        this.perPage = config.perPage || 10;
        
        // 回调函数
        this.fetchDataFunction = config.fetchDataFunction;
        this.updateTableFunction = config.updateTableFunction;
        this.onPageChange = config.onPageChange; // 可选的页面变化回调
        
        // DOM元素ID
        this.paginationInfoId = config.paginationInfoId;
        this.paginationPagesId = config.paginationPagesId;
        this.prevButtonId = config.prevButtonId;
        this.nextButtonId = config.nextButtonId;
        
        // 调试模式
        this.debug = config.debug || false;
    }
    
    /**
     * 改变页码
     * @param {string|number} direction - 'prev'表示上一页，'next'表示下一页，数字表示跳转到指定页
     */
    changePage(direction) {
        if (this.debug) {
        }
        
        // 如果direction是字符串'prev'，表示上一页
        if (direction === 'prev') {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        } 
        // 如果direction是字符串'next'，表示下一页
        else if (direction === 'next') {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        }
        // 如果direction是具体的页码（数字且大于0），直接设置
        else if (typeof direction === 'number' && direction > 0) {
            this.currentPage = direction;
        }
        
        if (this.debug) {
        }
        
        // 调用页面变化回调
        if (this.onPageChange) {
            this.onPageChange(this.currentPage);
        }
        
        // 获取数据
        this.fetchData();
    }
    
    /**
     * 获取数据
     */
    async fetchData() {
        if (!this.fetchDataFunction) {
            console.error('PaginationManager: fetchDataFunction未定义');
            return;
        }
        
        try {
            const result = await this.fetchDataFunction(this.currentPage, this.perPage);
            
            if (result && result.data) {
                // 更新表格数据
                if (this.updateTableFunction) {
                    this.updateTableFunction(result.data);
                }
                
                // 更新分页信息
                if (result.pagination) {
                    this.updatePagination(result.pagination);
                }
            }
        } catch (error) {
            console.error('PaginationManager: 获取数据失败', error);
        }
    }
    
    /**
     * 更新分页控件
     * @param {Object} pagination - 分页信息对象 {current_page, per_page, total_count, total_pages, has_prev, has_next}
     */
    updatePagination(pagination) {
        if (!pagination) return;
        
        this.currentPage = pagination.current_page || this.currentPage;
        this.totalPages = pagination.total_pages || 1;
        this.totalCount = pagination.total_count || 0;
        this.perPage = pagination.per_page || this.perPage;
        
        // 更新分页信息文本
        const infoElement = document.getElementById(this.paginationInfoId);
        if (infoElement) {
            const start = (this.currentPage - 1) * this.perPage + 1;
            const end = Math.min(this.currentPage * this.perPage, this.totalCount);
            infoElement.textContent = `显示第 ${start}-${end} 条，共 ${this.totalCount} 条记录`;
        }
        
        // 更新页码按钮
        const pagesElement = document.getElementById(this.paginationPagesId);
        if (pagesElement) {
            pagesElement.innerHTML = '';
            for (let i = 1; i <= Math.max(1, this.totalPages); i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `pagination-btn ${i === this.currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.onclick = () => this.changePage(i);
                pagesElement.appendChild(pageBtn);
            }
        }
        
        // 绑定上一页/下一页按钮事件
        const prevBtn = document.getElementById(this.prevButtonId);
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
            // 移除旧的事件监听器并添加新的
            prevBtn.onclick = () => this.changePage('prev');
        }
        
        const nextBtn = document.getElementById(this.nextButtonId);
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
            // 移除旧的事件监听器并添加新的
            nextBtn.onclick = () => this.changePage('next');
        }
    }
    
    /**
     * 重置到第一页
     */
    reset() {
        this.currentPage = 1;
        this.fetchData();
    }
    
    /**
     * 刷新当前页
     */
    refresh() {
        this.fetchData();
    }
}

// 导出到全局
window.PaginationManager = PaginationManager;

// 从cookie读取用户名并更新显示
function loadUserFromCookie() {
    const username = getCookie('username');
    
    const userElement = document.getElementById('currentUser');
    
    if (username) {
        currentUser = username;
        if (userElement) {
            userElement.textContent = currentUser;
        }
    } else {
        // 如果没有cookie，尝试从localStorage读取
        const storedUser = localStorage.getItem('pms_user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                const displayName = userData.username || userData.name || userData.displayName || '用户';
                currentUser = displayName;
                if (userElement) {
                    userElement.textContent = currentUser;
                }
                return;
            } catch (e) {
                console.error('解析localStorage用户数据失败:', e);
            }
        }
        
        // 如果都没有，显示默认用户名
        if (userElement) {
            userElement.textContent = currentUser;
        }
    }
}

// 系统管理分页变量
let systemUsersCurrentPage = 1;
let systemUsersTotalPages = 1;
let systemRolesCurrentPage = 1;
let systemRolesTotalPages = 1;
let systemLogsCurrentPage = 1;
let systemLogsTotalPages = 1;

// 权限控制相关函数

// 检查用户是否有特定权限
function hasPermission(permission) {
    if (!currentUserPermissions || !currentUserPermissions.navigation) {
        return true; // 默认允许
    }
    
    return currentUserPermissions.navigation[permission] === true;
}

// 页面切换时的权限检查
function checkPagePermission(pageId) {
    if (!hasPermission(pageId)) {
        showNotification('您没有访问此页面的权限', 'error');
        return false;
    }
    return true;
}

// 显示无权限页面
function showNoPermissionPage(pageId) {
    // 获取页面容器
    const pageContainer = document.getElementById('pageContainer');
    if (!pageContainer) return;
    
    // 页面名称映射
    const pageNames = {
        'timesheet': '工时管理',
        'project-management': '项目管理',
        'staff-management': '员工列表',
        'approval-center': '审核中心',
        'report-management': '报表管理',
        'project-dashboard': '项目看板',
        'ai-assistant': 'AI助手',
        'team-management': '团队管理',
        'budget-management': '预算管理',
        'system-management': '系统管理'
    };
    
    const pageName = pageNames[pageId] || '该页面';
    
    // 创建无权限提示页面
    const noPermissionHTML = `
        <div class="page active" id="no-permission-page" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #f5f5f5;">
            <div style="text-align: center; max-width: 500px; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.1);">
                <div style="font-size: 72px; margin-bottom: 20px;">🔒</div>
                <h2 style="color: #333; margin-bottom: 15px; font-size: 24px;">无访问权限</h2>
                <p style="color: #666; margin-bottom: 25px; font-size: 16px; line-height: 1.6;">
                    您当前的角色没有访问<strong style="color: #2196F3;">${pageName}</strong>的权限。
                </p>
                <p style="color: #999; font-size: 14px; margin-bottom: 30px;">
                    如需访问此功能，请联系系统管理员分配相应权限。
                </p>
                <button class="btn btn-primary" onclick="switchPage('timesheet')" style="padding: 10px 30px; font-size: 16px;">
                    返回工时管理
                </button>
            </div>
        </div>
    `;
    
    // 清空容器并插入无权限页面
    pageContainer.innerHTML = noPermissionHTML;
}

// 获取当前用户权限
async function getCurrentUserPermissions() {
    try {
        // 这里应该从后端获取当前用户的权限信息
        // 暂时返回默认权限，实际应该从用户登录信息中获取
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/current-user-permissions`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUserPermissions = data.permissions;
        } else {
            // 如果获取失败，使用默认权限（全部允许）
            currentUserPermissions = {
                navigation: {
                    'timesheet': true,
                    'project-management': true,
                    'staff-management': true,
                    'approval-center': true,
                    'report-management': true,
                    'project-dashboard': true,
                    'ai-assistant': true,
                    'team-management': true,
                    'budget-management': true,
                    'system-management': true
                }
            };
        }
        
        applyPermissions();
        
    } catch (error) {
        console.error('获取用户权限失败:', error);
        // 使用默认权限
        currentUserPermissions = {
            navigation: {
                'timesheet': true,
                'project-management': true,
                'staff-management': true,
                'approval-center': true,
                'report-management': true,
                'project-dashboard': true,
                'ai-assistant': true,
                'team-management': true,
                'budget-management': true,
                'system-management': true
            }
        };
        applyPermissions();
    }
}

// 应用权限控制
function applyPermissions() {
    if (!currentUserPermissions || !currentUserPermissions.navigation) {
        return;
    }
    
    const navigationPermissions = currentUserPermissions.navigation;
    
    // 控制左侧导航栏菜单项的显示/隐藏（通过 data-perm 更稳健）
    Object.keys(navigationPermissions).forEach(menuKey => {
        const menuItems = document.querySelectorAll(`.sidebar-menu-item[data-perm="${menuKey}"]`);
        menuItems.forEach(menuItem => {
            menuItem.style.display = navigationPermissions[menuKey] ? 'flex' : 'none';
        });
    });
    
    // 控制分组的显示/隐藏
    const sections = document.querySelectorAll('.menu-section[data-section]');
    sections.forEach(section => {
        const sectionName = section.getAttribute('data-section');
        const menuItems = section.querySelectorAll('.sidebar-menu-item[data-perm]');
        
        // 检查分组内是否有可见的菜单项
        let hasVisibleItems = false;
        menuItems.forEach(menuItem => {
            const permKey = menuItem.getAttribute('data-perm');
            if (navigationPermissions[permKey]) {
                hasVisibleItems = true;
            }
        });
        
        // 根据是否有可见菜单项来决定分组是否显示
        section.style.display = hasVisibleItems ? 'block' : 'none';
        
    });
}

// 刷新用户权限（用于权限变更后实时更新）
async function refreshUserPermissions() {
    await getCurrentUserPermissions();
    applyPermissions();
}

// 页面切换函数
async function switchPage(pageId) {

    // 处理特殊页面（跳转到外部链接的页面）
    const externalPages = {
        'report-management': () => openReportManagement(),
        'project-dashboard': () => openProjectDashboard(),
        'ai-assistant': () => openAIAssistant(),
        'knowledge-base': () => openKnowledgeBase()
    };
    
    if (externalPages[pageId]) {
        // 防止重复调用：使用时间戳和页面ID的组合
        const callKey = `${pageId}_${Date.now()}`;
        const lastCallKey = window.lastExternalPageCall;
        
        // 如果距离上次调用不到1秒，则跳过
        if (lastCallKey && lastCallKey.startsWith(pageId) && (Date.now() - parseInt(lastCallKey.split('_')[1])) < 1000) {
            return;
        }
        
        window.lastExternalPageCall = callKey;
        externalPages[pageId]();
        return;
    }

    // 更新URL hash
    window.location.hash = pageId;

    // 如果权限未初始化，先初始化权限
    if (currentUserPermissions === null) {
        await getCurrentUserPermissions();
    }

    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });

    // 权限检查
    if (!checkPagePermission(pageId)) {
        // 显示无权限页面
        showNoPermissionPage(pageId);
        return;
    }

    // 更新侧边栏选中状态
    try {
        const menuItems = document.querySelectorAll('.sidebar-menu .nav-item');
        menuItems.forEach(item => item.classList.remove('active'));
        const targetItem = document.querySelector(`.sidebar-menu .nav-item[onclick="switchPage('${pageId}')"]`);
        if (targetItem) {
            targetItem.classList.add('active');
        }
    } catch (e) {
        console.warn('更新侧边栏选中状态失败:', e);
    }

    // 全局更新审核中心数量（无需点击）
    try {
        if (typeof updateApprovalCount === 'function') {
            updateApprovalCount();
        }
    } catch (e) {
        console.warn('触发更新审核中心计数失败:', e);
    }

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
            // 加载报工明细（替换旧的静态演示）
            if (typeof loadTimesheetDetails === 'function') {
                loadTimesheetDetails(1);
            }
        },
        'approval-center': () => {
            // 初始化或重置审核中心分页
            if (!approvalPaginationManager) {
                initApprovalPagination();
            }
            approvalPaginationManager.reset();
        },
        'project-management': () => {
            // 统一设置全局 API 基址（只设一次）
            if (typeof window.API_BASE_URL === 'undefined') {
                window.API_BASE_URL = getApiBase();
            }

            const ensureAndInit = () => {
                if (typeof window.initializeProjectManagementPage === 'function') {
                    window.initializeProjectManagementPage();
                } else {
                    console.warn('[INIT] initializeProjectManagementPage not found after load');
                }
            };

            if (typeof window.initializeProjectManagementPage === 'function') {
                ensureAndInit();
            } else {
                // 动态加载脚本作为兜底（避免缓存或加载顺序导致的未定义）
                const existing = document.querySelector('script[data-pm-loader="true"]');
                if (existing) existing.remove();
                const s = document.createElement('script');
                s.src = `js/project-management.js?v=${Date.now()}`;
                s.async = false;
                s.dataset.pmLoader = 'true';
                s.onload = () => {
                    ensureAndInit();
                };
                s.onerror = () => console.error('[INIT] Failed to load project-management.js via fallback');
                document.head.appendChild(s);
            }
        },
        'staff-management': () => {
            initializeStaffManagementPage();
        },
        'budget-management': () => {
            if (typeof initializeBudgetManagementPage === 'function') {
                initializeBudgetManagementPage();
            }
        },
        'team-management': () => {
            // 团队管理页面初始化逻辑
        },
        'financial-management': () => {
            // 财务管理页面初始化逻辑
        },
        'business-management': () => {
            // 商务管理页面初始化逻辑
        },
        'task-scheduler': () => {
            // 计划任务页面初始化逻辑
        },
        'system-management': () => {
            // 系统管理页面初始化逻辑
            initializeSystemManagementPage();
        }
        // 其他页面可以继续在这里添加
    };

    const initializer = pageInitializers[pageId];

    // 立即更新currentPage，避免状态不同步
    currentPage = pageId;

    if (window.componentLoader && typeof window.componentLoader.loadPage === 'function') {
        try {
            await window.componentLoader.loadPage(pageId, '#pageContainer', 'replace', initializer);
        } catch (error) {
            console.error(`[switchPage] Error loading page '${pageId}':`, error);
            showNotification(`加载页面失败: ${error.message}`, 'error');
            // 如果页面加载失败，回滚currentPage
            currentPage = 'timesheet';
        }
    } else {
        console.error('[switchPage] ComponentLoader or loadPage function is not available.');
        showNotification('页面加载器不可用', 'error');
        // 如果组件加载器不可用，回滚currentPage
        currentPage = 'timesheet';
    }
}

// 审核中心标签页切换
function switchApprovalTab() { /* tabs removed */ }

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
    
    
    // 根据标签页加载对应数据
    if (tabName === 'users') {
        loadSystemUsers();
    } else if (tabName === 'roles') {
        loadSystemRoles();
    } else if (tabName === 'logs') {
        loadSystemLogs();
    }
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
    showNotification(`查看合同 ${contractId} 详情`, 'info');
}

function editContract(contractId) {
    showNotification(`编辑合同 ${contractId}`, 'info');
}

function deleteContract(contractId) {
    if (confirm(`确定要删除合同 ${contractId} 吗？`)) {
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
// showProjectForm 函数已移至后面实现

function viewProjectPlan(projectId) {
    showNotification(`查看项目 ${projectId} 计划`, 'info');
}

// 项目成员管理相关变量
let currentProjectId = null;
let projectMembers = [];

function viewProjectMembers(projectId) {
    currentProjectId = projectId;
    
    // 更新模态框标题
    const titleEl = document.getElementById('projectMembersTitle');
    if (titleEl) {
        titleEl.textContent = `项目成员管理 - ${projectId}`;
    }
    
    // 显示模态框
    const modal = document.getElementById('projectMembersModal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
    
    // 加载项目成员数据
    loadProjectMembers(projectId);
}

function closeProjectMembersModal() {
    const modal = document.getElementById('projectMembersModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
    currentProjectId = null;
}

function loadProjectMembers(projectId) {
    // 模拟数据，实际应该从后端获取
    projectMembers = [
        {
            id: 1,
            projectRole: '项目经理',
            personnelType: '内部员工',
            member: '王磊',
            entryDate: '2025-01-01',
            exitDate: '',
            budgetDays: 100
        },
        {
            id: 2,
            projectRole: '开发工程师',
            personnelType: '内部员工',
            member: '张三',
            entryDate: '2025-01-15',
            exitDate: '',
            budgetDays: 80
        },
        {
            id: 3,
            projectRole: '测试工程师',
            personnelType: '外包人员',
            member: '李四',
            entryDate: '2025-01-20',
            exitDate: '2025-06-30',
            budgetDays: 60
        },
        {
            id: 4,
            projectRole: 'UI设计师',
            personnelType: '实习生',
            member: '王五',
            entryDate: '2025-02-01',
            exitDate: '',
            budgetDays: 40
        }
    ];
    
    renderProjectMembersList();
}

function renderProjectMembersList() {
    const tbody = document.getElementById('projectMembersList');
    if (!tbody) return;
    
    if (projectMembers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">暂无成员数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = projectMembers.map(member => `
        <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 16px 12px; font-size: 14px;">${member.projectRole}</td>
            <td style="padding: 16px 12px; font-size: 14px;">${member.personnelType}</td>
            <td style="padding: 16px 12px; font-size: 14px; font-weight: 500;">${member.member}</td>
            <td style="padding: 16px 12px; font-size: 14px;">${member.entryDate}</td>
            <td style="padding: 16px 12px; font-size: 14px;">${member.exitDate || '-'}</td>
            <td style="padding: 16px 12px; font-size: 14px; text-align: center;">${member.budgetDays}</td>
            <td style="padding: 16px 12px;">
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editProjectMember(${member.id})">编辑</button>
                    <button class="action-btn delete-btn" onclick="removeProjectMember(${member.id})">移除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function addProjectMember() {
    const projectRole = document.getElementById('pmProjectRole')?.value?.trim();
    const personnelType = document.getElementById('pmPersonnelType')?.value?.trim();
    const member = document.getElementById('pmMember')?.value?.trim();
    const entryDate = document.getElementById('pmEntryDate')?.value?.trim();
    const exitDate = document.getElementById('pmExitDate')?.value?.trim();
    const budgetDays = document.getElementById('pmBudgetDays')?.value?.trim();
    
    if (!projectRole || !personnelType || !member || !entryDate || !budgetDays) {
        showNotification('请完善必填项', 'warning');
        return;
    }
    
    // 检查是否已存在该成员
    const existingMember = projectMembers.find(m => m.member === member);
    if (existingMember) {
        showNotification('该成员已存在于项目中', 'warning');
        return;
    }
    
    // 添加新成员
    const newMember = {
        id: Date.now(),
        projectRole,
        personnelType,
        member,
        entryDate,
        exitDate: exitDate || '',
        budgetDays: parseFloat(budgetDays)
    };
    
    projectMembers.push(newMember);
    renderProjectMembersList();
    clearProjectMemberForm();
    showNotification('成员添加成功', 'success');
}

function clearProjectMemberForm() {
    document.getElementById('pmProjectRole').value = '';
    document.getElementById('pmPersonnelType').value = '';
    document.getElementById('pmMember').value = '';
    document.getElementById('pmEntryDate').value = '';
    document.getElementById('pmExitDate').value = '';
    document.getElementById('pmBudgetDays').value = '';
}

function editProjectMember(memberId) {
    const member = projectMembers.find(m => m.id === memberId);
    if (!member) return;
    
    // 填充表单
    document.getElementById('pmProjectRole').value = member.projectRole;
    document.getElementById('pmPersonnelType').value = member.personnelType;
    document.getElementById('pmMember').value = member.member;
    document.getElementById('pmEntryDate').value = member.entryDate;
    document.getElementById('pmExitDate').value = member.exitDate;
    document.getElementById('pmBudgetDays').value = member.budgetDays;
    
    showNotification('已加载成员信息到表单，请修改后重新添加', 'info');
}

function removeProjectMember(memberId) {
    if (!confirm('确定要移除该成员吗？')) return;
    
    projectMembers = projectMembers.filter(m => m.id !== memberId);
    renderProjectMembersList();
    showNotification('成员已移除', 'success');
}

function openProjectBoard(projectId) {
    // 在新标签页中打开项目看板
    window.open('http://10.10.201.76:8100/#/de-link/PStBiMLR', '_blank');
    showNotification('正在打开项目看板...', 'info');
}

// editProject 函数已移至后面实现

// deleteProject 函数已移至后面实现

// 审核相关函数
function viewTimesheetDetail(timesheetId) {
    showNotification(`查看报工详情 ${timesheetId}`, 'info');
}

async function approveTimesheet(timesheetId) {
    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/reports/${timesheetId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            showNotification('报工记录已通过', 'success');
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
                const apiBase = getApiBase();
                const response = await fetch(`${apiBase}/api/reports/${timesheetId}/reject`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });
                
                if (response.ok) {
                    showNotification('报工记录已驳回', 'warning');
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
    
    showNotification(`查看预算详情 ${budgetId}`, 'info');
}

async function approveBudget(budgetId) {
    if (confirm('确定要通过这个项目预算吗？')) {
        try {
            const apiBase = getApiBase();
            const response = await fetch(`${apiBase}/api/budget/approve/${budgetId}`, {
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
                const apiBase = getApiBase();
                const response = await fetch(`${apiBase}/api/budget/reject/${budgetId}`, {
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
    
    // 调用接口获取报工审核数据
    fetchTimesheetApprovalData(currentTimesheetPage);
}

// ======================== 审核中心分页管理器 ========================
// 使用通用PaginationManager管理审核中心分页
let approvalPaginationManager = null;

// 初始化审核中心分页管理器
function initApprovalPagination() {
    approvalPaginationManager = new PaginationManager({
        perPage: 10,
        
        // 获取数据的函数
        fetchDataFunction: async (page, perPage) => {
            const apiBase = getApiBase();
            const response = await fetch(`${apiBase}/api/reports/pending?page=${page}&per_page=${perPage}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                // 更新审核中心数量
                try { updateApprovalCountFromData(result); } catch(e) { console.warn('更新审核中心数量失败:', e); }
                return {
                    data: result.reports,
                    pagination: result.pagination
                };
            }
            throw new Error('获取审核数据失败');
        },
        
        // 更新表格的函数
        updateTableFunction: (reports) => {
            updateTimesheetApprovalTable(reports);
        },
        
        // DOM元素ID
        paginationInfoId: 'timesheet-pagination-info',
        paginationPagesId: 'timesheet-pagination-pages',
        prevButtonId: 'timesheet-prev-btn',
        nextButtonId: 'timesheet-next-btn',
        
        // 开启调试模式
        debug: true
    });
    
    return approvalPaginationManager;
}

// 兼容旧的函数名
function changeTimesheetPage(direction) {
    if (approvalPaginationManager) {
        approvalPaginationManager.changePage(direction);
    }
}

// 兼容旧的刷新函数
function refreshTimesheetApprovalList() {
    if (approvalPaginationManager) {
        approvalPaginationManager.refresh();
    }
}

function refreshBudgetApprovalList() {
    
    // 调用接口获取预算审核数据
    fetchBudgetApprovalData();
}

// 获取报工审核数据的函数
async function fetchTimesheetApprovalData(page = 1) {
    
    
    const tbody = document.getElementById('timesheet-approval-tbody');
    
    
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #999;">正在加载数据...</td></tr>';
    }
    
    try {
        const apiBase = getApiBase();
        const url = `${apiBase}/api/reports/pending?page=${page}&per_page=10`;
        
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        
        
        if (response.ok) {
            const data = await response.json();
            
            updateTimesheetApprovalTable(data.reports);
            updateTimesheetApprovalPagination(data.pagination);
            try { updateApprovalCountFromData(data); } catch(e) { console.warn('更新审核中心数量失败:', e); }
            // 只在刷新时显示通知，不在分页时显示
            // showNotification('报工审核列表已刷新', 'success');
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
async function fetchBudgetApprovalData() { /* 已移除预算审核Tab */ }

// 更新报工审核表格
function updateTimesheetApprovalTable(data) {
    const tbody = document.getElementById('timesheet-approval-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">暂无待审核的报工记录</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.employee_name}</td>
            <td title="${item.project_name || '-'}">${truncateText(item.project_name, 10)}</td>
            <td>${item.report_date}</td>
            <td>${item.hours_spent}</td>
            <td title="${item.task_description || '-'}">${truncateText(item.task_description, 20)}</td>
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
function updateBudgetApprovalTable() { /* 已移除预算审核Tab */ }

// 人员管理相关函数
function editEmployee(employeeId) {
    
    showNotification(`编辑员工 ${employeeId}`, 'info');
}

function deleteEmployee(employeeId) {
    if (confirm(`确定要删除员工 ${employeeId} 吗？`)) {
        
        showNotification(`员工 ${employeeId} 已删除`, 'success');
    }
}

// 通知函数
function showNotification(message, type = 'info') {
    
    
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
    
    
}

// 初始化主应用
function initializeMainApp() {
    
    
    // 从URL hash获取当前页面，如果没有则默认为工时管理
    const currentPageFromHash = window.location.hash.substring(1) || 'timesheet';
    
    
    
    // 切换到从hash获取的页面
    switchPage(currentPageFromHash);
    
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

    // 从URL hash获取当前页面，如果没有则默认为工时管理
    const currentPageFromHash = window.location.hash.substring(1) || 'timesheet';
    
    
    
    // 切换到从hash获取的页面
    switchPage(currentPageFromHash);
}

// 监听URL hash变化
window.addEventListener('hashchange', function() {
    const newPage = window.location.hash.substring(1);
    
    if (newPage && newPage !== currentPage) {
        
        switchPage(newPage);
    }
});

// 测试函数：手动设置hash
window.testHash = function(pageId) {
    
    window.location.hash = pageId;
};

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
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/reports/analysis?time_range=${timeRange}&page=1&per_page=10`);
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
        const apiBase = getApiBase();
        const [hoursTrend, projectProgress, teamEfficiency, financialAnalysis] = await Promise.all([
            fetch(`${apiBase}/api/charts/hours-trend`).then(r => r.json()),
            fetch(`${apiBase}/api/charts/project-progress`).then(r => r.json()),
            fetch(`${apiBase}/api/charts/team-efficiency`).then(r => r.json()),
            fetch(`${apiBase}/api/charts/financial-analysis`).then(r => r.json())
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
            <td>${getStatusText(report.status)}</td>
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
    
    const s = Number(status);
    let result;
    switch(s) {
        case 1: result = 'approved'; break;
        case 2: result = 'pending'; break;
        case 0: result = 'pending'; break;
        case 4: result = 'leave'; break;
        case 3: result = 'rejected'; break;
        default: result = 'pending'; break;
    }
    
    return result;
}

// 获取状态文本（统一的状态映射）
function getStatusText(status) {
    const s = Number(status);
    switch(s) {
        case 0: return '待审核';
        case 1: return '已通过';
        case 2: return '待审核';
        case 3: return '已驳回';
        case 4: return '请假';
        default: return '未知';
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
    
    showNotification(`查看Webhook ${webhookId} 详情`, 'info');
}

function editWebhook(webhookId) {
    
    showNotification(`编辑Webhook ${webhookId}`, 'info');
}

function deleteWebhook(webhookId) {
    if (confirm(`确定要删除Webhook ${webhookId} 吗？`)) {
        
        showNotification(`Webhook ${webhookId} 已删除`, 'success');
    }
}

// API管理相关函数
function viewAPI(apiId) {
    
    showNotification(`查看API ${apiId} 详情`, 'info');
}

function editAPI(apiId) {
    
    showNotification(`编辑API ${apiId}`, 'info');
}

function deleteAPI(apiId) {
    if (confirm(`确定要删除API ${apiId} 吗？`)) {
        
        showNotification(`API ${apiId} 已删除`, 'success');
    }
}
// 这些函数导出已移至文件末尾
window.editProjectMember = editProjectMember;
window.removeProjectMember = removeProjectMember;
window.openProjectBoard = openProjectBoard;
// window.editProject = editProject; // 已迁移到 project-management.js
// window.deleteProject = deleteProject; // 已迁移到 project-management.js
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
    
    
    showNotification(`已切换到${tabNames[tabName] || tabName}`, 'info');
}

function viewDataTask(taskId) {
    
    showNotification(`查看数据任务 ${taskId} 详情`, 'info');
}

function editDataTask(taskId) {
    
    showNotification(`编辑数据任务 ${taskId}`, 'info');
}

function deleteDataTask(taskId) {
    if (confirm(`确定要删除数据任务 ${taskId} 吗？`)) {
        
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
// window.loadProjectList 已移至 project-management.js
// 这些函数导出已移至文件末尾

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

function getBudgetStatusText(status) {
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
            <td>${getBudgetStatusText(item.status)}</td>
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

// ======================== 系统管理 ========================
async function initializeSystemManagementPage() {
    
    await loadSystemUsers();
    await loadSystemRoles();
    await loadSystemLogs();
    // 不再需要调用initSystemPagination，因为每个load函数内部已经调用了对应的initPagination
    // initSystemPagination(); 
}

async function loadSystemUsers() {
    
    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/employees?page=${systemUsersCurrentPage}&per_page=10`, { 
            credentials: 'include' 
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const users = data.employees || [];
        const pagination = {
            page: data.page || 1,
            pages: data.pages || 1,
            total: data.total || users.length
        };
        
        window.__systemUsersCache = users; // 缓存用户数据
        renderSystemUsersTable(users);
        initSystemUsersPagination(pagination.page, pagination.pages, pagination.total);
    } catch (error) {
        console.error('Error loading system users:', error);
        showNotification('加载用户列表失败: ' + error.message, 'error');
    }
}

async function loadSystemRoles() {
    
    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/roles?page=${systemRolesCurrentPage}&per_page=10`, { 
            credentials: 'include' 
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const roles = data.items || data;  // 兼容新旧格式
        const pagination = data.pagination || {
            page: 1,
            pages: 1,
            total_count: roles.length
        };
        
        renderSystemRolesTable(roles);
        window.__rolesCache = roles;
        initSystemRolesPagination(pagination.page, pagination.total_pages || pagination.pages, pagination.total_count);
    } catch (error) {
        console.error('Error loading system roles:', error);
        showNotification('加载角色列表失败: ' + error.message, 'error');
    }
}

function renderSystemUsersTable(users) {
    const tbody = document.querySelector('#system-users tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (!users.length) {
        tbody.innerHTML = '<tr id="system-users-empty"><td colspan="6" style="text-align:center; color:#999; padding: 16px;">暂无用户</td></tr>';
        return;
    }
    
    users.forEach(u => {
        const tr = document.createElement('tr');
        const userName = (u.name || '-').replace(/'/g, "\\'");  // 转义单引号
        const userEmail = (u.email || '-').replace(/'/g, "\\'");
        tr.innerHTML = `
          <td>${u.name || '-'}</td>
          <td>${u.email || '-'}</td>
          <td>${u.role_name || '-'}</td>
          <td>${u.department || '未分配部门'}</td>
          <td>${u.last_login || '-'}</td>
          <td>
            <div class="action-buttons">
              <button class="action-btn edit-btn" onclick="editSystemUser('${u.id}')">编辑</button>
              <button class="action-btn delete-btn" onclick="deleteSystemUser('${u.id}', '${userName}', '${userEmail}')">删除</button>
            </div>
          </td>`;
        tbody.appendChild(tr);
    });
}

function renderSystemRolesTable(roles) {
    const tbody = document.querySelector('#system-roles tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (!roles.length) {
        tbody.innerHTML = '<tr id="system-roles-empty"><td colspan="4" style="text-align:center; color:#999; padding: 16px;">暂无角色</td></tr>';
        return;
    }
    
    roles.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.role_name || '-'}</td>
          <td>${r.role_code || '-'}</td>
          <td>${r.description || '-'}</td>
          <td>
            <div class="action-buttons">
              <button class="action-btn edit-btn" onclick="editRole(${r.id})">编辑</button>
              <button class="action-btn delete-btn" onclick="deleteSystemRole('${r.id}')">删除</button>
            </div>
          </td>`;
        tbody.appendChild(tr);
    });
}

function initSystemPagination() {
    // 初始化分页
    initSystemUsersPagination(1, 1, 1);
    initSystemRolesPagination(1, 1, 1);
    initSystemLogsPagination(1, 1, 1);
}

// 系统管理分页函数

function initSystemUsersPagination(current, total, totalCount) {
    systemUsersCurrentPage = current;
    systemUsersTotalPages = Math.max(1, total);
    const info = document.getElementById('users-pagination-info');
    const pagesEl = document.getElementById('users-pagination-pages');
    const prevBtn = document.getElementById('users-prev-btn');
    const nextBtn = document.getElementById('users-next-btn');
    if (info) info.textContent = `第 ${systemUsersCurrentPage} / ${systemUsersTotalPages} 页，共 ${totalCount} 条`;
    if (pagesEl) {
        pagesEl.innerHTML = '';
        for (let i = 1; i <= systemUsersTotalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `pagination-btn ${i === systemUsersCurrentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => gotoSystemUsersPage(i);
            pagesEl.appendChild(btn);
        }
    }
    if (prevBtn) prevBtn.disabled = systemUsersCurrentPage <= 1;
    if (nextBtn) nextBtn.disabled = systemUsersCurrentPage >= systemUsersTotalPages;
}

function changeSystemUsersPage(direction) {
    const target = systemUsersCurrentPage + direction;
    gotoSystemUsersPage(target);
}

function gotoSystemUsersPage(page) {
    if (page < 1 || page > systemUsersTotalPages) return;
    systemUsersCurrentPage = page;
    loadSystemUsers();
    // initSystemUsersPagination 会在 loadSystemUsers 中调用，这里不需要重复调用
}

// 角色分页

function initSystemRolesPagination(current, total, totalCount) {
    systemRolesCurrentPage = current;
    systemRolesTotalPages = Math.max(1, total);
    const info = document.getElementById('roles-pagination-info');
    const pagesEl = document.getElementById('roles-pagination-pages');
    const prevBtn = document.getElementById('roles-prev-btn');
    const nextBtn = document.getElementById('roles-next-btn');
    if (info) info.textContent = `第 ${systemRolesCurrentPage} / ${systemRolesTotalPages} 页，共 ${totalCount} 条`;
    if (pagesEl) {
        pagesEl.innerHTML = '';
        for (let i = 1; i <= systemRolesTotalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `pagination-btn ${i === systemRolesCurrentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => gotoSystemRolesPage(i);
            pagesEl.appendChild(btn);
        }
    }
    if (prevBtn) prevBtn.disabled = systemRolesCurrentPage <= 1;
    if (nextBtn) nextBtn.disabled = systemRolesCurrentPage >= systemRolesTotalPages;
}

function changeSystemRolesPage(direction) {
    const target = systemRolesCurrentPage + direction;
    gotoSystemRolesPage(target);
}

function gotoSystemRolesPage(page) {
    if (page < 1 || page > systemRolesTotalPages) return;
    systemRolesCurrentPage = page;
    loadSystemRoles();
    // initSystemRolesPagination 会在 loadSystemRoles 中调用，这里不需要重复调用
}

// 日志分页

function initSystemLogsPagination(current, total, totalCount) {
    systemLogsCurrentPage = current;
    systemLogsTotalPages = Math.max(1, total);
    const info = document.getElementById('logs-pagination-info');
    const pagesEl = document.getElementById('logs-pagination-pages');
    const prevBtn = document.getElementById('logs-prev-btn');
    const nextBtn = document.getElementById('logs-next-btn');
    if (info) info.textContent = `第 ${systemLogsCurrentPage} / ${systemLogsTotalPages} 页，共 ${totalCount} 条`;
    if (pagesEl) {
        pagesEl.innerHTML = '';
        for (let i = 1; i <= systemLogsTotalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `pagination-btn ${i === systemLogsCurrentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => gotoSystemLogsPage(i);
            pagesEl.appendChild(btn);
        }
    }
    if (prevBtn) prevBtn.disabled = systemLogsCurrentPage <= 1;
    if (nextBtn) nextBtn.disabled = systemLogsCurrentPage >= systemLogsTotalPages;
}

// 加载操作日志
async function loadSystemLogs(page = null, perPage = 10) {
    // 使用传入的page或全局变量systemLogsCurrentPage
    const currentPage = page !== null ? page : systemLogsCurrentPage;
    
    const tbody = document.getElementById('system-logs-tbody');
    if (!tbody) return;
    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/operation-logs?page=${currentPage}&per_page=${perPage}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        
        const items = data.items || [];
        renderSystemLogsTable(items);
        
        // 确保pagination存在
        if (data.pagination) {
            
        initSystemLogsPagination(data.pagination.page, data.pagination.total_pages, data.pagination.total_count);
        } else {
            console.error('[日志管理] pagination数据缺失');
        }
    } catch (error) {
        console.error('Error loading system logs:', error);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#f44336; padding: 16px;">加载失败</td></tr>';
        }
    }
}

function renderSystemLogsTable(items) {
    const tbody = document.getElementById('system-logs-tbody');
    if (!tbody) return;
    if (!items.length) {
        tbody.innerHTML = '<tr id="system-logs-empty"><td colspan="3" style="text-align:center; color:#999; padding: 16px;">暂无日志</td></tr>';
        return;
    }
    tbody.innerHTML = items.map(log => {
        // 格式化时间为北京时间 YYYY-MM-DD HH:mm:ss（不做任何时区转换，直接使用后端返回的时间）
        let time = '-';
        if (log.operation_time) {
            try {
                if (typeof log.operation_time === 'string') {
                    // 直接使用字符串，不做任何Date转换（避免时区问题）
                    // 去掉微秒和时区标识，只保留 YYYY-MM-DD HH:mm:ss 部分
                    time = log.operation_time
                        .replace('T', ' ')           // 替换ISO格式的T
                        .replace(/\.\d+/, '')        // 去掉微秒
                        .replace(/[A-Z]+$/, '')      // 去掉末尾的时区标识(如GMT, UTC)
                        .trim()
                        .substring(0, 19);           // 只取前19个字符 (YYYY-MM-DD HH:mm:ss)
                } else {
                    // 如果是其他类型，直接转字符串
                    time = String(log.operation_time).substring(0, 19);
                }
            } catch (e) {
                console.error('时间格式化错误:', e, log.operation_time);
                time = String(log.operation_time);
            }
        }
        const user = log.user_name || '-';
        const op = log.operation || '-';
        return `
            <tr>
                <td>${time}</td>
                <td>${user}</td>
                <td>${op}</td>
            </tr>`;
    }).join('');
}

function changeSystemLogsPage(direction) {
    const target = systemLogsCurrentPage + direction;
    gotoSystemLogsPage(target);
}

function gotoSystemLogsPage(page) {
    if (page < 1 || page > systemLogsTotalPages) return;
    systemLogsCurrentPage = page;
    loadSystemLogs(page);
    // initSystemLogsPagination 会在 loadSystemLogs 中调用，这里不需要重复调用
}

// 系统管理相关函数
async function editSystemUser(userId) {
    
    
    // 获取当前用户信息
    const currentUser = window.__systemUsersCache?.find(u => u.id == userId);
    if (!currentUser) {
        showNotification('用户信息不存在', 'error');
        return;
    }
    
    // 创建编辑用户模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3>编辑用户</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group"><label>用户名 <span style="color: red;">*</span></label><input id="editUserName" class="form-input" placeholder="请输入用户名" value="${currentUser.name}" required disabled style="background: #f5f5f5; cursor: not-allowed;"></div>
          <div class="form-group"><label>邮箱 <span style="color: red;">*</span></label><input id="editUserEmail" class="form-input" placeholder="请输入邮箱" value="${currentUser.email}" required></div>
          <div class="form-group"><label>角色 <span style="color: red;">*</span></label><select id="editUserRole" class="form-select" required></select></div>
          <div class="form-group"><label>部门 <span style="color: red;">*</span></label><select id="editUserDept" class="form-select" required><option value="">请选择部门</option></select></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
          <button class="btn btn-primary" onclick="submitEditUser(${userId}, this)">保存</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    await populateRoleOptions('editUserRole', currentUser.role_id);
    await populateDepartmentOptions('editUserDept', currentUser.department_id);
}

// 提交编辑用户
async function submitEditUser(userId, btn) {
    const modal = btn.closest('.modal');
    const name = (modal.querySelector('#editUserName')?.value || '').trim();
    const email = (modal.querySelector('#editUserEmail')?.value || '').trim();
    const role_id = modal.querySelector('#editUserRole')?.value;
    const department_id = modal.querySelector('#editUserDept')?.value;
    
    if (!name || !email || !role_id || !department_id) {
        showNotification('请填写所有必填字段（用户名、邮箱、角色、部门）', 'error');
        return;
    }
    
    try {
        btn.disabled = true;
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, role_id, department_id })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '更新失败');
        }
        
        showNotification('用户更新成功', 'success');
        modal.remove();
        loadSystemUsers(); // 重新加载用户列表
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

function deleteSystemUser(userId, userName, userEmail) {
    // 如果没有传入用户名，尝试从表格行中获取
    if (!userName) {
        const row = event.target.closest('tr');
        if (row) {
            const cells = row.querySelectorAll('td');
            userName = cells[0]?.textContent.trim() || `用户ID: ${userId}`;
            userEmail = cells[1]?.textContent.trim() || '';
        } else {
            userName = `用户ID: ${userId}`;
            userEmail = '';
        }
    }
    
    // 显示用户名和邮箱的确认对话框
    const confirmMessage = userEmail 
        ? `确定要删除用户 "${userName}" (${userEmail}) 吗？此操作不可恢复！`
        : `确定要删除用户 "${userName}" 吗？此操作不可恢复！`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    
        
        const apiBase = window.API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
        fetch(`${apiBase}/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                showNotification(data.message, 'success');
                loadSystemUsers(); // 重新加载用户列表
            } else {
                showNotification('删除失败', 'error');
            }
        })
        .catch(error => {
            console.error('删除用户失败:', error);
            showNotification('删除用户失败', 'error');
        });
}

function editSystemRole(roleId) {
    
    
    // 从缓存中获取角色信息
    const roles = window.__rolesCache || [];
    const currentRole = roles.find(r => r.id == roleId);
    
    if (!currentRole) {
        showNotification('角色信息不存在', 'error');
        return;
    }
    
    // 创建编辑角色模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3>编辑角色</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group"><label>角色名称</label><input id="editRoleName" class="form-input" placeholder="请输入角色名称" value="${currentRole.role_name || ''}"></div>
          <div class="form-group"><label>角色代码</label><input id="editRoleCode" class="form-input" placeholder="请输入角色代码" value="${currentRole.role_code || ''}"></div>
          <div class="form-group"><label>描述</label><textarea id="editRoleDescription" class="form-input" placeholder="请输入角色描述" rows="3">${currentRole.description || ''}</textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
          <button class="btn btn-primary" onclick="submitEditRole(${roleId}, this)">保存</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
}

// 提交编辑角色
async function submitEditRole(roleId, btn) {
    const modal = btn.closest('.modal');
    const role_name = (modal.querySelector('#editRoleName')?.value || '').trim();
    const role_code = (modal.querySelector('#editRoleCode')?.value || '').trim();
    const description = (modal.querySelector('#editRoleDescription')?.value || '').trim();
    
    if (!role_name || !role_code) {
        showNotification('请填写角色名称和角色代码', 'error');
        return;
    }
    
    try {
        btn.disabled = true;
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/roles/${roleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ role_name, role_code, description })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '更新失败');
        }
        
        showNotification('角色更新成功', 'success');
        modal.remove();
        loadSystemRoles(); // 重新加载角色列表
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

async function deleteSystemRole(roleId) {
    
    
    // 确认删除
    if (!confirm('确定要删除这个角色吗？')) {
        return;
    }
    
    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/roles/${roleId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '删除失败');
        }
        
        showNotification('角色删除成功', 'success');
        loadSystemRoles(); // 重新加载角色列表
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// 更新populateRoleOptions函数以支持默认选中
async function populateRoleOptions(selectId, selectedRoleId = null) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    
    // 始终重新加载角色数据，确保获取所有角色（不使用缓存）
        try {
        const apiBase = getApiBase();
        // 使用大的per_page值获取所有角色
        const response = await fetch(`${apiBase}/api/roles?page=1&per_page=1000`, { 
                credentials: 'include' 
            });
        if (!response.ok) {
            throw new Error('获取角色列表失败');
        }
        
        const data = await response.json();
        
        
        // 适配新的返回格式 {items: [...], pagination: {...}}
        const roles = data.items || data;
        
        
        // 更新缓存
        window.__rolesCache = roles;
        
        // 填充下拉框
        sel.innerHTML = '<option value="">请选择角色</option>' + 
            roles.map(r => `<option value="${r.id}" ${r.id == selectedRoleId ? 'selected' : ''}>${r.role_name}</option>`).join('');
            
        } catch (error) {
            console.error('Failed to load roles:', error);
        showNotification('加载角色列表失败', 'error');
        sel.innerHTML = '<option value="">加载失败</option>';
        }
}

// 部门下拉选项
async function populateDepartmentOptions(selectId, selectedDeptId = null) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    try {
        // 复用缓存
        if (!window.__departmentsCache) {
            const apiBase = getApiBase();
            const res = await fetch(`${apiBase}/api/departments`, { credentials: 'include' });
            if (!res.ok) throw new Error('加载部门失败');
            window.__departmentsCache = await res.json();
        }
        const depts = window.__departmentsCache || [];
        sel.innerHTML = '<option value="">请选择部门</option>' +
            depts.map(d => `<option value="${d.id}" ${String(d.id) === String(selectedDeptId) ? 'selected' : ''}>${d.name}</option>`).join('');
    } catch (e) {
        console.error('加载部门失败', e);
        sel.innerHTML = '<option value="">加载失败</option>';
    }
}

// 显示新增用户表单
async function showUserForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3>新增用户</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group"><label>用户名 <span style="color: red;">*</span></label><input id="newUserName" class="form-input" placeholder="请输入用户名" required></div>
          <div class="form-group"><label>邮箱 <span style="color: red;">*</span></label><input id="newUserEmail" class="form-input" placeholder="请输入邮箱" type="email" required></div>
          <div class="form-group"><label>密码 <span style="color: red;">*</span></label><input id="newUserPassword" type="password" class="form-input" placeholder="请输入密码（至少6位）" required></div>
          <div class="form-group"><label>角色 <span style="color: red;">*</span></label><select id="newUserRole" class="form-select" required></select></div>
          <div class="form-group"><label>部门 <span style="color: red;">*</span></label><select id="newUserDept" class="form-select" required><option value="">请选择部门</option></select></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
          <button class="btn btn-primary" onclick="submitNewUser(this)">保存</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    await populateRoleOptions('newUserRole');
    await populateDepartmentOptions('newUserDept');
}

// 提交新增用户
async function submitNewUser(btn) {
    const modal = btn.closest('.modal');
    const name = (modal.querySelector('#newUserName')?.value || '').trim();
    const email = (modal.querySelector('#newUserEmail')?.value || '').trim();
    const password = (modal.querySelector('#newUserPassword')?.value || '').trim();
    const role_id = modal.querySelector('#newUserRole')?.value;
    const department_id = modal.querySelector('#newUserDept')?.value;
    
    if (!name || !email || !password || !role_id || !department_id) {
        showNotification('请填写所有必填字段（用户名、邮箱、密码、角色、部门）', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('密码长度至少6位', 'error');
        return;
    }
    
    try {
        btn.disabled = true;
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, password, role_id, department_id })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '创建失败');
        }
        
        showNotification('用户创建成功', 'success');
        modal.remove();
        loadSystemUsers(); // 重新加载用户列表
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

// 显示新增角色表单
function showRoleForm(roleId = null) {
     // 调试信息
    const modal = document.getElementById('roleModal');
    if (!modal) {
         // 调试信息
        return;
    }
    
    // 确保"导航权限配置"区域存在；若不存在则动态注入
    try {
        const grid = document.getElementById('permissionsGrid');
        if (!grid) {
            const container = modal.querySelector('.permissions-container');
            if (container) {
                container.innerHTML = `
                    <div id="permissionsGrid" class="permissions-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        <!-- 工时管理权限已移除，后端强制为true11111 -->
                        <label class="permission-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 4px;">
                            <input type="checkbox" id="perm-project-management" name="permissions" value="project-management">
                            <span>📋 项目管理</span>
                        </label>
                        <label class="permission-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 4px;">
                            <input type="checkbox" id="perm-staff-management" name="permissions" value="staff-management">
                            <span>👤 员工列表</span>
                        </label>
                        <label class="permission-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 4px;">
                            <input type="checkbox" id="perm-approval-center" name="permissions" value="approval-center">
                            <span>✓ 审核中心</span>
                        </label>
                        <label class="permission-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 4px;">
                            <input type="checkbox" id="perm-report-management" name="permissions" value="report-management">
                            <span>📊 报表管理</span>
                        </label>
                        <label class="permission-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 4px;">
                            <input type="checkbox" id="perm-project-dashboard" name="permissions" value="project-dashboard">
                            <span>📈 项目看板</span>
                        </label>
                        <label class="permission-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 4px;">
                            <input type="checkbox" id="perm-ai-assistant" name="permissions" value="ai-assistant">
                            <span>? 智能问数</span>
                        </label>
                        <label class="permission-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 4px;">
                            <input type="checkbox" id="perm-knowledge-base" name="permissions" value="knowledge-base">
                            <span>📚 知识库</span>
                        </label>
                        <label class="permission-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 4px;">
                            <input type="checkbox" id="perm-team-management" name="permissions" value="team-management">
                            <span>👥 团队管理</span>
                        </label>
                        <label class="permission-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 4px;">
                            <input type="checkbox" id="perm-budget-management" name="permissions" value="budget-management">
                            <span>$ 预算管理</span>
                        </label>
                        <label class="permission-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 4px;">
                            <input type="checkbox" id="perm-system-management" name="permissions" value="system-management">
                            <span>⚙ 系统管理</span>
                        </label>
                    </div>
                `;
            }
        }
    } catch (e) {
        console.warn('确保权限网格存在失败:', e);
    }

    modal.classList.add('show');
    modal.style.display = 'flex';
     // 调试信息
    
    const form = document.getElementById('roleForm');
    const title = document.getElementById('roleModalTitle');
    
    form.reset();
    form.dataset.roleId = roleId ? roleId : '';
    
    if (roleId) {
        title.textContent = '编辑角色';
        loadRoleData(roleId);
    } else {
        title.textContent = '新增角色';
        // 设置默认权限（全部勾选）
        setDefaultPermissions();
    }
}

// 设置默认权限
function setDefaultPermissions() {
    // 工时管理不在列表中，因为后端强制为true
    const permissions = [
        'project-management', 'staff-management', 'approval-center',
        'report-management', 'project-dashboard', 'ai-assistant', 'knowledge-base', 'team-management',
        'budget-management', 'system-management'
    ];
    
    permissions.forEach(perm => {
        const checkbox = document.getElementById(`perm-${perm}`);
        if (checkbox) checkbox.checked = true;
    });
}

// 加载角色数据
async function loadRoleData(roleId) {
     // 调试信息
    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/roles/${roleId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('加载角色数据失败');
        }
        
        const role = await response.json();
         // 调试信息
        
        // 填充表单数据
        document.getElementById('roleName').value = role.role_name || '';
        document.getElementById('roleCode').value = role.role_code || '';
        document.getElementById('roleDescription').value = role.description || '';
        
        // 填充权限数据
        const permissions = role.permissions ? JSON.parse(role.permissions) : {};
        const navigationPermissions = permissions.navigation || {};
         // 调试信息
        
        // 设置权限勾选框
        Object.keys(navigationPermissions).forEach(perm => {
            const checkbox = document.getElementById(`perm-${perm}`);
            if (checkbox) {
                checkbox.checked = navigationPermissions[perm] === true;
                 // 调试信息
            }
        });
        
    } catch (error) {
        console.error('加载角色数据失败:', error);
        showNotification('加载角色数据失败', 'error');
    }
}

// 关闭角色模态框
function closeRoleModal() {
     // 调试信息
    const modal = document.getElementById('roleModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
         // 调试信息
    } else {
         // 调试信息
    }
}

// 保存角色
async function saveRole() {
     // 调试信息
    const form = document.getElementById('roleForm');
    const roleId = form.dataset.roleId;
     // 调试信息
    
    const roleData = {
        role_name: document.getElementById('roleName').value.trim(),
        role_code: document.getElementById('roleCode').value.trim(),
        description: document.getElementById('roleDescription').value.trim(),
        status: 1,  // 默认启用状态
        permissions: getPermissionsData()
    };
    
     // 调试信息
    
    if (!roleData.role_name || !roleData.role_code) {
        showNotification('请填写角色名称和角色代码', 'error');
        return;
    }
    
    try {
        const apiBase = getApiBase();
        const url = roleId ? `${apiBase}/api/roles/${roleId}` : `${apiBase}/api/roles`;
        const method = roleId ? 'PUT' : 'POST';
         // 调试信息
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(roleData)
        });
        
        const data = await response.json();
         // 调试信息
        
        if (!response.ok) {
            throw new Error(data.message || '保存失败');
        }
        
        showNotification(roleId ? '角色更新成功' : '角色创建成功', 'success');
        closeRoleModal();
        
        // 使用分页加载函数刷新角色列表（保持当前页）
        if (typeof loadSystemRoles === 'function') {
            loadSystemRoles();
        } else {
            loadRolesList(); // 降级方案
        }
        
        // 刷新当前用户权限，以便立即应用权限变更
        if (typeof refreshUserPermissions === 'function') {
            setTimeout(() => {
                refreshUserPermissions();
            }, 500);
        }
        
    } catch (error) {
        console.error('保存角色失败:', error);
        showNotification(`保存失败: ${error.message}`, 'error');
    }
}

// 获取权限数据
function getPermissionsData() {
    const permissions = {};
    const navigationPermissions = {};
    
    // 获取所有权限勾选框
    const checkboxes = document.querySelectorAll('input[name="permissions"]');
    checkboxes.forEach(checkbox => {
        navigationPermissions[checkbox.value] = checkbox.checked;
    });
    
    permissions.navigation = navigationPermissions;
    return permissions;
}

// 编辑角色
function editRole(roleId) {
    showRoleForm(roleId);
}

// 删除角色
async function deleteRole(roleId) {
    if (!confirm('确定要删除这个角色吗？此操作不可撤销。')) {
        return;
    }
    
    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/roles/${roleId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '删除失败');
        }
        
        showNotification('角色删除成功', 'success');
        
        // 使用分页加载函数刷新角色列表（保持当前页）
        if (typeof loadSystemRoles === 'function') {
            loadSystemRoles();
        } else {
            loadRolesList(); // 降级方案
        }
        
    } catch (error) {
        console.error('删除角色失败:', error);
        showNotification(`删除失败: ${error.message}`, 'error');
    }
}

// 加载角色列表
async function loadRolesList() {
    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/roles?page=1&per_page=100`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('加载角色列表失败');
        }
        
        const data = await response.json();
        
        
        // 适配新的分页返回格式 {items: [...], pagination: {...}}
        const roles = data.items || data.roles || (Array.isArray(data) ? data : []);
        
        
        renderRolesTable(roles);
        
    } catch (error) {
        console.error('加载角色列表失败:', error);
        const tbody = document.getElementById('system-roles-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#f44336; padding:20px;">加载失败: ' + error.message + '</td></tr>';
        }
    }
}

// 渲染角色表格
function renderRolesTable(roles) {
    const tbody = document.getElementById('system-roles-tbody');
    if (!tbody) return;
    
    if (roles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding:16px;">暂无角色</td></tr>';
        return;
    }
    
    tbody.innerHTML = roles.map(role => `
        <tr>
            <td>${role.role_name || ''}</td>
            <td>${role.role_code || ''}</td>
            <td>${role.description || ''}</td>
            <td>${role.status == 1 ? '启用' : '禁用'}</td>
            <td>
                <button class="btn btn-secondary" onclick="editRole(${role.id})" style="margin-right: 8px;">编辑</button>
                <button class="btn btn-danger" onclick="deleteRole(${role.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

// 显示新增项目表单
// showProjectForm 函数已移至 project-management.js 中实现

// 提交新增项目
async function submitNewProject(btn) {
    const modal = btn.closest('.modal');
    const project_code = (modal.querySelector('#newProjectCode')?.value || '').trim();
    const project_name = (modal.querySelector('#newProjectName')?.value || '').trim();
    const status = modal.querySelector('#newProjectStatus')?.value || 'Active';
    const project_type = modal.querySelector('#newProjectType')?.value || '2';
    
    if (!project_code || !project_name) {
        showNotification('请填写项目编码和项目名称', 'error');
        return;
    }
    
    try {
        btn.disabled = true;
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ project_code, project_name, status, project_type })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '创建失败');
        }
        
        showNotification('项目创建成功', 'success');
        modal.remove();
        loadProjectList(); // 重新加载项目列表
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

// 编辑项目
// editProject 函数已移至 project-management.js

// submitEditProject 函数已移至 project-management.js

// deleteProject 函数已移至 project-management.js

// 初始化项目管理页面
// 项目管理相关函数已移至 project-management.js

// 导出系统管理函数到全局
window.initializeSystemManagementPage = initializeSystemManagementPage;
window.loadSystemUsers = loadSystemUsers;
window.loadSystemRoles = loadSystemRoles;
window.changeSystemUsersPage = changeSystemUsersPage;
window.changeSystemRolesPage = changeSystemRolesPage;
window.changeSystemLogsPage = changeSystemLogsPage;
window.editSystemUser = editSystemUser;
window.deleteSystemUser = deleteSystemUser;
window.editSystemRole = editSystemRole;
window.deleteSystemRole = deleteSystemRole;

window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
// 以下函数已移至 staff-management.js，不再从 main.js 导出
// window.searchEmployees = searchEmployees;
// window.filterByDepartment = filterByDepartment;
// window.changeEmployeePage = changeEmployeePage;
window.showNotification = showNotification;

// 导出报表分析相关函数
window.loadReportAnalysisData = loadReportAnalysisData;
window.loadChartData = loadChartData;
window.updateKPICards = updateKPICards;
window.updateAnalysisTable = updateAnalysisTable;
window.updatePagination = updatePagination;
window.updateChartPlaceholders = updateChartPlaceholders;

// 报工明细（报表分析页）功能
let timesheetDetailPage = 1;
const TIMESHEET_DETAIL_PAGE_SIZE = 10;

async function loadTimesheetDetails(page = 1) {
    timesheetDetailPage = page;
    const tbody = document.querySelector('#timesheetAnalysisTable tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">正在加载数据...</td></tr>';
    }
    try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/timesheet/details?page=${page}&per_page=${TIMESHEET_DETAIL_PAGE_SIZE}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || '加载失败');
        const items = data.items || [];
        if (tbody) {
            if (items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">暂无数据</td></tr>';
            } else {
                tbody.innerHTML = items.map(r => `
                    <tr>
                        <td>${(r.report_date || '').slice(0,10)}</td>
                        <td>${r.employee_name || '-'}</td>
                        <td title="${r.project_name || '-'}">${truncateText(r.project_name, 10)}</td>
                        <td>${r.hours_spent ?? 0}</td>
                        <td>${(((r.hours_spent ?? 0) / 8).toFixed ? (r.hours_spent/8).toFixed(1) : (r.hours_spent ?? 0) / 8)}</td>
                        <td title="${r.task_description || '-'}">${truncateText(r.task_description, 20)}</td>
                        <td>${getStatusText(r.status)}</td>
                        <td>${r.report_date ? (r.report_date.replace('T',' ').slice(0,19)) : '-'}</td>
                    </tr>
                `).join('');
            }
        }
        renderTimesheetDetailPagination(data.pagination);
    } catch (e) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#f44336;">加载失败</td></tr>';
        showNotification('加载报工明细失败: ' + e.message, 'error');
    }
}

function renderTimesheetDetailPagination(pagination) {
    if (!pagination) return;
    const infoEl = document.getElementById('timesheet-detail-pagination-info');
    const pagesEl = document.getElementById('timesheet-detail-pages');
    const prevBtn = document.getElementById('timesheet-detail-prev');
    const nextBtn = document.getElementById('timesheet-detail-next');
    const total = pagination.total_count || 0;
    const page = pagination.current_page || 1;
    const pages = pagination.total_pages || 1;
    const start = total === 0 ? 0 : (page - 1) * TIMESHEET_DETAIL_PAGE_SIZE + 1;
    const end = total === 0 ? 0 : Math.min(page * TIMESHEET_DETAIL_PAGE_SIZE, total);
    if (infoEl) infoEl.textContent = `显示第 ${start}-${end} 条，共 ${total} 条记录`;
    if (prevBtn) prevBtn.disabled = page <= 1 || total === 0;
    if (nextBtn) nextBtn.disabled = page >= pages || total === 0;
    if (pagesEl) {
        pagesEl.innerHTML = '';
        for (let i = 1; i <= Math.max(1, pages); i++) {
            const btn = document.createElement('button');
            btn.className = `pagination-btn ${i === page ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => changeTimesheetDetailPage(i);
            pagesEl.appendChild(btn);
        }
    }
}

function changeTimesheetDetailPage(p) {
    if (p === -1) {
        loadTimesheetDetails(Math.max(1, timesheetDetailPage - 1));
    } else if (p === 1) {
        loadTimesheetDetails(timesheetDetailPage + 1);
    } else if (typeof p === 'number' && p > 0) {
        loadTimesheetDetails(p);
    }
}

// 导出函数
window.loadTimesheetDetails = loadTimesheetDetails;
window.changeTimesheetDetailPage = changeTimesheetDetailPage;

// 项目管理相关函数
// loadProjectList 函数已移至 project-management.js

// updateProjectListTable 函数已移至 project-management.js

// filterProjectType 函数已移至 project-management.js

// getProjectStatusInfo 函数已移至 project-management.js

// updateProjectStats 函数已移至 project-management.js

// showProjectForm 函数已移至后面实现

// editProject 函数已移至后面实现

// deleteProject 函数已移至后面实现

// searchProjects 函数已移至 project-management.js

// 报表分析跳转函数
function openReportAnalysis() {
    
    window.open('http://10.10.201.67:8000/#/dashboard-preview?resourceId=5c4da1b2587f4ffbbcf645be9f6984ca', '_blank');
}

// 报表管理跳转函数
function openReportManagement() {
    
    window.open('http://120.55.115.65:8100/#/workbranch/index', '_blank');
}

// 项目大屏跳转函数
function openProjectDashboard() {
    
    window.open('http://10.10.201.76:8100/#/de-link/PLgPsH9r', '_blank');
}

// 智能问数跳转函数
function openAIAssistant() {
    
    window.open('http://120.55.115.65:8000/#/chat/index', '_blank');
}

// 知识库跳转函数
function openKnowledgeBase() {
    
    window.open('https://120.55.115.65:2443/', '_blank');
}

// 人员管理页面初始化函数
async function initializeStaffManagementPage() {
    
    
    await loadEmployeeList();
    
    await loadDepartments();
    
}

// 注意：此函数已废弃，由 staff-management.js 中的版本替代
// 保留仅为向后兼容
// function searchEmployees() {
//     // 已移至 staff-management.js
// }

// 注意：此函数已废弃，由 staff-management.js 中的版本替代
// function filterByDepartment() {
//     // 已移至 staff-management.js
// }

// 注意：此函数已废弃，由 staff-management.js 中的版本替代
// function changeEmployeePage(direction) {
//     // 已移至 staff-management.js
// }

// 注意：此函数已废弃，由 staff-management.js 中的版本替代
// async function loadEmployeeList(page = 1, search = '', department = '') {
//     // 已移至 staff-management.js
// }

// 注意：此函数已废弃，由 staff-management.js 中的版本替代
// function updateEmployeeListTable(employees) {
//     // 已移至 staff-management.js
// }

// 查看员工报工报表
function viewEmployeeTimesheet(employeeId, employeeName) {
    
    
    // 创建查看报工报表的模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px; width: 90%;">
        <div class="modal-header">
          <h3>${employeeName} - 报工报表</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <style>
            .modal .data-table th,
            .modal .data-table td {
              text-align: left !important;
            }
          </style>
          <div class="table-container">
            <table class="data-table" style="table-layout: fixed; width: 100%;">
              <colgroup>
                <col style="width: 15%;">  <!-- 日期 -->
                <col style="width: 20%;">  <!-- 项目 -->
                <col style="width: 35%;">  <!-- 任务描述 -->
                <col style="width: 15%;">  <!-- 工时 -->
                <col style="width: 15%;">  <!-- 状态 -->
              </colgroup>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>项目</th>
                  <th>任务描述</th>
                  <th>工时</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody id="employee-timesheet-tbody">
                <tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">正在加载数据...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">关闭</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    // 直接加载数据（无筛选条件）
    
    loadEmployeeTimesheet(employeeId, modal);
}

// 加载员工报工数据
async function loadEmployeeTimesheet(employeeId, modalRef = null) {
    const modal = modalRef || document.querySelector('.modal');
    if (!modal) {
        console.warn('[Timesheet] modal not found, abort');
        return;
    }
    
    const tbody = modal.querySelector('#employee-timesheet-tbody');
    if (!tbody) {
        console.warn('[Timesheet] tbody not found in modal, abort');
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">正在加载数据...</td></tr>';
    
    try {
        
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/reports?employee_id=${employeeId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        const reports = Array.isArray(data) ? data : (data.reports || []);
        
        if (reports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">该时间段内没有报工记录</td></tr>';
            return;
        }
        
        tbody.innerHTML = reports.map(report => `
            <tr>
                <td>${report.report_date || '-'}</td>
                <td title="${report.project_name || '-'}">${truncateText(report.project_name, 10)}</td>
                <td title="${report.task_description || '-'}">${truncateText(report.task_description, 20)}</td>
                <td>${report.hours_spent || 0}小时</td>
                <td>
                    ${getStatusText(report.status)}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('加载员工报工数据失败:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #f44336;">加载数据失败，请重试</td></tr>';
        showNotification('加载报工数据失败: ' + error.message, 'error');
    }
}

// getStatusClass 和 getStatusText 函数已在前面定义（第1589行和第1606行），此处移除重复定义

// 截取文本，超过指定长度显示省略号
function truncateText(text, maxLength = 10) {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// 更新分页信息
function updateEmployeePagination(total, page, pages) {
    const start = total === 0 ? 0 : (page - 1) * 10 + 1;
    const end = total === 0 ? 0 : Math.min(page * 10, total);
    
    const infoEl = document.getElementById('employee-pagination-info');
    const pagesEl = document.getElementById('employee-pagination-pages');
    const prevBtn = document.getElementById('employee-prev-btn');
    const nextBtn = document.getElementById('employee-next-btn');
    
    if (infoEl) {
        infoEl.textContent = `显示第 ${start}-${end} 条，共 ${total} 条记录`;
    }
    if (prevBtn) prevBtn.disabled = page <= 1 || total === 0;
    if (nextBtn) nextBtn.disabled = page >= pages || total === 0;
    
    if (pagesEl) {
        pagesEl.innerHTML = '';
        for (let i = 1; i <= Math.max(1, pages); i++) {
            const btn = document.createElement('button');
            btn.className = `pagination-btn ${i === page ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => gotoEmployeePage(i);
            pagesEl.appendChild(btn);
        }
    }
}

// 员工分页跳转（与系统管理风格一致）
function gotoEmployeePage(i) {
    changeEmployeePage(i);
}

// 加载部门列表
async function loadDepartments() {
    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/departments`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const departments = await response.json();
        
        
        // 更新部门下拉框
        const departmentFilter = document.getElementById('departmentFilter');
        if (departmentFilter) {
            // 清空现有选项（保留"全部部门"选项）
            departmentFilter.innerHTML = '<option value="">全部部门</option>';
            
            // 添加部门选项
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.name;
                option.textContent = dept.name;
                departmentFilter.appendChild(option);
            });
        }
        
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

// 导出所有函数到全局作用域
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
// 以下函数已移至 staff-management.js，不再从 main.js 导出
// window.searchEmployees = searchEmployees;
// window.filterByDepartment = filterByDepartment;
// window.changeEmployeePage = changeEmployeePage;
// window.loadEmployeeList = loadEmployeeList;
// window.updateEmployeeListTable = updateEmployeeListTable;
// window.updateEmployeePagination = updateEmployeePagination;
window.loadDepartments = loadDepartments;
// window.initializeStaffManagementPage 由 staff-management.js 导出
window.viewEmployeeTimesheet = viewEmployeeTimesheet;
window.loadEmployeeTimesheet = loadEmployeeTimesheet;
window.getStatusClass = getStatusClass;
window.getStatusText = getStatusText;

// 系统管理相关函数导出
window.initializeSystemManagementPage = initializeSystemManagementPage;
window.loadSystemUsers = loadSystemUsers;
window.loadSystemRoles = loadSystemRoles;
window.renderSystemUsersTable = renderSystemUsersTable;
window.renderSystemRolesTable = renderSystemRolesTable;
window.initSystemPagination = initSystemPagination;
window.initSystemUsersPagination = initSystemUsersPagination;
window.initSystemRolesPagination = initSystemRolesPagination;
window.initSystemLogsPagination = initSystemLogsPagination;
window.changeSystemUsersPage = changeSystemUsersPage;
window.changeSystemRolesPage = changeSystemRolesPage;
window.changeSystemLogsPage = changeSystemLogsPage;
window.gotoSystemUsersPage = gotoSystemUsersPage;
window.gotoSystemRolesPage = gotoSystemRolesPage;
window.gotoSystemLogsPage = gotoSystemLogsPage;
window.editSystemUser = editSystemUser;
window.deleteSystemUser = deleteSystemUser;
window.editSystemRole = editSystemRole;
window.deleteSystemRole = deleteSystemRole;

// 其他必要的函数导出
window.switchSystemTab = switchSystemTab;
window.showNotification = showNotification;
window.showUserForm = showUserForm;
window.submitNewUser = submitNewUser;
window.submitEditUser = submitEditUser;
window.populateRoleOptions = populateRoleOptions;
window.populateDepartmentOptions = populateDepartmentOptions;
window.showRoleForm = showRoleForm;
window.closeRoleModal = closeRoleModal;
window.saveRole = saveRole;
window.editRole = editRole;
window.deleteRole = deleteRole;
window.loadRolesList = loadRolesList;
window.renderRolesTable = renderRolesTable;

// 导出权限控制函数
window.getCurrentUserPermissions = getCurrentUserPermissions;
window.applyPermissions = applyPermissions;
window.hasPermission = hasPermission;
window.checkPagePermission = checkPagePermission;
window.refreshUserPermissions = refreshUserPermissions;
window.showNoPermissionPage = showNoPermissionPage;

// 导出cookie操作函数
window.getCookie = getCookie;
window.setCookie = setCookie;
window.loadUserFromCookie = loadUserFromCookie;

// 重置密码相关函数
function openResetPasswordModal() {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        // 清空表单
        document.getElementById('resetPasswordForm').reset();
    }
}

function closeResetPasswordModal() {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        // 清空表单
        document.getElementById('resetPasswordForm').reset();
    }
}

async function resetPassword() {
    const oldPassword = document.getElementById('oldPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    // 验证输入
    if (!oldPassword || !newPassword || !confirmPassword) {
        showNotification('请填写所有必填项', 'warning');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('新密码和确认密码不一致', 'warning');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('新密码长度至少6位', 'warning');
        return;
    }

    try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                oldPassword: oldPassword,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('密码修改成功', 'success');
            closeResetPasswordModal();
        } else {
            showNotification(result.message || '密码修改失败', 'error');
        }
    } catch (error) {
        console.error('重置密码失败:', error);
        showNotification('网络错误，请稍后重试', 'error');
    }
}

// 导出重置密码函数
window.openResetPasswordModal = openResetPasswordModal;
window.closeResetPasswordModal = closeResetPasswordModal;
window.resetPassword = resetPassword;
