-- 初始化测试用户数据
-- 适配当前的employees表结构

-- 确保有测试用户数据
INSERT IGNORE INTO `employees` (`id`, `name`, `role`, `role_id`, `department_id`, `email`, `password_hash`, `phone`, `status`, `hire_date`) VALUES
(1, '王磊', '系统管理员', 1, 1, 'wanglei@company.com', '$2b$12$LQv3c1yqBwEHXw.9UdnJKOsG5ZK8YE5i1zJgqvVJf8Qh4.6J8.V8O', '13800138001', 1, '2024-01-01'),
(2, '张三', '项目经理', 2, 1, 'zhangsan@company.com', '$2b$12$LQv3c1yqBwEHXw.9UdnJKOsG5ZK8YE5i1zJgqvVJf8Qh4.6J8.V8O', '13800138002', 1, '2024-01-15'),
(3, '李四', '开发工程师', 3, 1, 'lisi@company.com', '$2b$12$LQv3c1yqBwEHXw.9UdnJKOsG5ZK8YE5i1zJgqvVJf8Qh4.6J8.V8O', '13800138003', 1, '2024-02-01'),
(4, '王五', '测试工程师', 4, 2, 'wangwu@company.com', '$2b$12$LQv3c1yqBwEHXw.9UdnJKOsG5ZK8YE5i1zJgqvVJf8Qh4.6J8.V8O', '13800138004', 1, '2024-02-15'),
(5, '赵六', '产品经理', 5, 3, 'zhaoliu@company.com', '$2b$12$LQv3c1yqBwEHXw.9UdnJKOsG5ZK8YE5i1zJgqvVJf8Qh4.6J8.V8O', '13800138005', 1, '2024-03-01');

-- 如果roles表存在，确保有基础角色数据
INSERT IGNORE INTO `roles` (`id`, `role_name`, `role_code`, `description`, `permissions`, `status`) VALUES
(1, '系统管理员', 'admin', '系统管理员，拥有所有权限', '["timesheet", "project-management", "staff-management", "team-management", "budget-management", "approval-center", "report-analysis", "system-management"]', 1),
(2, '项目经理', 'project_manager', '项目经理，负责项目管理和团队协调', '["timesheet", "project-management", "team-management", "approval-center", "report-analysis"]', 1),
(3, '开发工程师', 'developer', '开发工程师，负责项目开发工作', '["timesheet", "project-management"]', 1),
(4, '测试工程师', 'tester', '测试工程师，负责项目测试工作', '["timesheet", "project-management"]', 1),
(5, '产品经理', 'product_manager', '产品经理，负责产品规划和需求管理', '["timesheet", "project-management", "report-analysis"]', 1);

-- 创建user_sessions表（如果不存在）
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL COMMENT '员工ID',
  `session_token` varchar(255) NOT NULL COMMENT '会话令牌',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text COMMENT '用户代理',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `fk_sessions_employee` (`employee_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户会话表';

-- 查看当前用户数据
SELECT id, name, email, role, role_id, status FROM employees;
