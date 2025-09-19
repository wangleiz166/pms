// 组件加载器 - 用于动态加载HTML组件
class ComponentLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * 加载HTML组件
     * @param {string} componentPath - 组件文件路径
     * @param {string} targetSelector - 目标容器选择器
     * @param {boolean} useCache - 是否使用缓存，默认true
     * @returns {Promise<void>}
     */
    async loadComponent(componentPath, targetSelector, useCache = true, mode = 'replace') {
        try {
            // 如果正在加载同一个组件，返回现有的Promise
            if (this.loadingPromises.has(componentPath)) {
                return await this.loadingPromises.get(componentPath);
            }

            // 检查缓存
            if (useCache && this.cache.has(componentPath)) {
                const cachedContent = this.cache.get(componentPath);
                this.insertContent(targetSelector, cachedContent);
                return;
            }

            // 创建加载Promise
            const loadingPromise = this.fetchComponent(componentPath);
            this.loadingPromises.set(componentPath, loadingPromise);

            const content = await loadingPromise;
            
            // 缓存内容
            if (useCache) {
                this.cache.set(componentPath, content);
            }

            // 插入内容
            this.insertContent(targetSelector, content, mode);

            // 清理加载Promise
            this.loadingPromises.delete(componentPath);

        } catch (error) {
            console.error(`Failed to load component: ${componentPath}`, error);
            this.loadingPromises.delete(componentPath);
            throw error;
        }
    }

    /**
     * 获取组件内容
     * @param {string} componentPath - 组件文件路径
     * @returns {Promise<string>}
     */
    async fetchComponent(componentPath) {
        // 添加时间戳避免浏览器缓存，确保获取到最新的组件内容
        const cacheBuster = `v=${Date.now()}`;
        const url = componentPath.includes('?')
            ? `${componentPath}&${cacheBuster}`
            : `${componentPath}?${cacheBuster}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    }

    /**
     * 插入内容到目标容器
     * @param {string} targetSelector - 目标容器选择器
     * @param {string} content - HTML内容
     */
    insertContent(targetSelector, content, mode = 'replace') {
        console.log(`[ComponentLoader] Inserting content into ${targetSelector}, mode: ${mode}`);
        
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) {
            const error = `Target element not found: ${targetSelector}`;
            console.error(error);
            throw new Error(error);
        }
        
        console.log(`[ComponentLoader] Target element found:`, targetElement);
        console.log(`[ComponentLoader] Content length: ${content.length} characters`);
        
        if (mode === 'append') {
            targetElement.insertAdjacentHTML('beforeend', content);
            console.log(`[ComponentLoader] Content appended to ${targetSelector}`);
        } else {
            targetElement.innerHTML = content;
            console.log(`[ComponentLoader] Content replaced in ${targetSelector}`);
        }
        
        // 验证内容是否已插入
        const insertedContent = targetElement.innerHTML;
        console.log(`[ComponentLoader] Content verification - length: ${insertedContent.length}`);
    }

    /**
     * 加载多个组件
     * @param {Array<{path: string, target: string}>} components - 组件配置数组
     * @returns {Promise<void[]>}
     */
    async loadComponents(components) {
        const promises = components.map(({ path, target, mode }) => 
            this.loadComponent(path, target, true, mode)
        );
        return await Promise.all(promises);
    }

    /**
     * 预加载组件（仅缓存，不插入DOM）
     * @param {string[]} componentPaths - 组件路径数组
     * @returns {Promise<void[]>}
     */
    async preloadComponents(componentPaths) {
        const promises = componentPaths.map(async (path) => {
            if (!this.cache.has(path)) {
                const content = await this.fetchComponent(path);
                this.cache.set(path, content);
            }
        });
        return await Promise.all(promises);
    }

    /**
     * 清除缓存
     * @param {string} componentPath - 可选，指定要清除的组件路径
     */
    clearCache(componentPath = null) {
        if (componentPath) {
            this.cache.delete(componentPath);
        } else {
            this.cache.clear();
        }
    }

    /**
     * 获取缓存状态
     * @returns {Object}
     */
    getCacheInfo() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * 加载页面组件
     * @param {string} pageId - 页面ID
     * @param {string} targetSelector - 目标容器选择器
     * @param {string} mode - 插入模式 ('replace' or 'append')
     * @param {function} callback - 加载成功后执行的回调函数
     * @returns {Promise<void>}
     */
    async loadPage(pageId, targetSelector = '#main-content', mode = 'replace', callback, forceReload = false) {
        console.log(`[ComponentLoader] Loading page: ${pageId}, target: ${targetSelector}`);
        
        const pagePath = PAGE_COMPONENTS[pageId];
        if (!pagePath) {
            const error = `Page component not found for pageId: ${pageId}`;
            console.error(error);
            throw new Error(error);
        }

        console.log(`[ComponentLoader] Page path: ${pagePath}`);

        try {
            let content;
            // 清除缓存并强制重新获取内容
            this.cache.delete(pagePath);
            console.log(`[ComponentLoader] Cache cleared for ${pageId}, fetching fresh content from ${pagePath}`);
            content = await this.fetchComponent(pagePath);
            this.cache.set(pagePath, content);
            console.log(`[ComponentLoader] Fresh content fetched and cached for ${pageId}`);
            
            // 替换或追加内容
            console.log(`[ComponentLoader] Inserting content into ${targetSelector}`);
            console.log(`[ComponentLoader] Content preview:`, content.substring(0, 200) + '...');
            this.insertContent(targetSelector, content, mode);

            // 更新当前页面ID
            this.currentPage = pageId;
            
            // 显示页面 - 添加active类
            setTimeout(() => {
                // 查找页面元素
                const pageElement = document.querySelector(`#${pageId}Page`);
                
                if (pageElement) {
                    pageElement.classList.add('active');
                    pageElement.style.display = 'block';
                    console.log(`[ComponentLoader] Added active class and display block to ${pageId}Page`);
                } else {
                    console.warn(`[ComponentLoader] Page element #${pageId}Page not found`);
                    // 查找所有页面元素并显示最后一个
                    const allPages = document.querySelectorAll('.page');
                    if (allPages.length > 0) {
                        const lastPage = allPages[allPages.length - 1];
                        lastPage.classList.add('active');
                        lastPage.style.display = 'block';
                        console.log(`[ComponentLoader] Added active class to last page element`);
                    }
                }
            }, 100);

            // 如果有回调函数，则在DOM更新后执行
            if (typeof callback === 'function') {
                console.log(`[ComponentLoader] Executing callback for ${pageId}`);
                // 使用 setTimeout 确保浏览器有时间渲染DOM
                setTimeout(() => {
                    try {
                        callback();
                        console.log(`[ComponentLoader] Callback executed successfully for ${pageId}`);
                    } catch (callbackError) {
                        console.error(`[ComponentLoader] Callback error for ${pageId}:`, callbackError);
                    }
                }, 100);
            }
            
            console.log(`[ComponentLoader] Page ${pageId} loaded successfully`);
        } catch (error) {
            console.error(`[ComponentLoader] Failed to load page: ${pageId}`, error);
            throw error;
        }
    }
}

// 创建全局组件加载器实例
window.componentLoader = new ComponentLoader();

// 页面组件配置
const PAGE_COMPONENTS = {
    'login': 'components/pages/login.html',
    'timesheet': 'components/pages/timesheet.html',
    'project-management': 'components/pages/project-management.html',
    'staff-management': 'components/pages/staff-management.html',
    'team-management': 'components/pages/team-management.html',
    'budget-management': 'components/pages/budget-management.html',
    'approval-center': 'components/pages/approval-center.html',
    'report-analysis': 'components/pages/report-analysis.html',
    'financial-flow': 'components/pages/financial-flow.html',
    'system-management': 'components/pages/system-management.html',
    'data-center': 'components/pages/data-center.html'
};

// 公共组件配置
const COMMON_COMPONENTS = {
    'sidebar': 'components/common/sidebar.html',
    'notification': 'components/common/notification.html',
    'timesheet-modal': 'components/common/modals/timesheet-modal.html',
    'timesheet-detail-modal': 'components/common/modals/timesheet-detail-modal.html'
};

/**
 * 加载公共组件
 * @param {string} componentName - 组件名称
 * @param {string} targetSelector - 目标选择器
 * @returns {Promise<void>}
 */
async function loadCommonComponent(componentName, targetSelector) {
    const componentPath = COMMON_COMPONENTS[componentName];
    if (!componentPath) {
        throw new Error(`Common component not found: ${componentName}`);
    }
    
    await componentLoader.loadComponent(componentPath, targetSelector);
}

/**
 * 初始化应用组件
 * @returns {Promise<void>}
 */
async function initializeApp() {
    try {
        // 显示加载状态
        showLoadingState();

        // 加载公共组件
        await componentLoader.loadComponents([
            { path: COMMON_COMPONENTS.sidebar, target: '#sidebarContainer' },
            { path: COMMON_COMPONENTS.notification, target: '#notificationContainer' },
            { path: COMMON_COMPONENTS['timesheet-modal'], target: '#modalContainer', mode: 'append' },
            { path: COMMON_COMPONENTS['timesheet-detail-modal'], target: '#modalContainer', mode: 'append' }
        ]);

        // 不在这里加载登录页面，由主逻辑决定加载什么
        console.log('组件加载器初始化完成，等待主逻辑决定加载内容');

        // 隐藏加载状态
        hideLoadingState();

        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showErrorState('应用初始化失败，请刷新页面重试');
    }
}

/**
 * 显示加载状态
 */
function showLoadingState() {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
}

/**
 * 隐藏加载状态
 */
function hideLoadingState() {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * 显示错误状态
 * @param {string} message - 错误消息
 */
function showErrorState(message) {
    const errorElement = document.getElementById('errorState');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    hideLoadingState();
}

