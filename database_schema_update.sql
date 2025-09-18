-- 用户中心模块数据库结构更新
-- 创建时间: 2025-01-17

-- 1. 创建角色表
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(100) NOT NULL COMMENT '角色名称',
  `role_code` varchar(50) NOT NULL COMMENT '角色代码',
  `description` text COMMENT '角色描述',
  `permissions` json COMMENT '权限配置JSON',
  `status` tinyint DEFAULT 1 COMMENT '状态: 1=启用, 0=禁用',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_code` (`role_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色表';

-- 2. 插入默认角色数据
INSERT INTO `roles` (`role_name`, `role_code`, `description`, `permissions`, `status`) VALUES
('系统管理员', 'admin', '系统管理员，拥有所有权限', '["timesheet", "project-management", "staff-management", "team-management", "budget-management", "approval-center", "report-analysis", "system-management"]', 1),
('项目经理', 'project_manager', '项目经理，负责项目管理和团队协调', '["timesheet", "project-management", "team-management", "approval-center", "report-analysis"]', 1),
('开发工程师', 'developer', '开发工程师，负责项目开发工作', '["timesheet", "project-management"]', 1),
('测试工程师', 'tester', '测试工程师，负责项目测试工作', '["timesheet", "project-management"]', 1),
('产品经理', 'product_manager', '产品经理，负责产品规划和需求管理', '["timesheet", "project-management", "report-analysis"]', 1),
('人事专员', 'hr_specialist', '人事专员，负责人员管理', '["staff-management", "team-management", "report-analysis"]', 1),
('财务专员', 'finance_specialist', '财务专员，负责预算和财务管理', '["budget-management", "approval-center", "report-analysis"]', 1),
('普通员工', 'employee', '普通员工，基础权限', '["timesheet"]', 1);

-- 3. 修改employees表结构
-- 备份原表数据（可选）
-- CREATE TABLE employees_backup AS SELECT * FROM employees;

-- 添加新字段
ALTER TABLE `employees` 
ADD COLUMN `role_id` int DEFAULT NULL COMMENT '角色ID，关联roles表' AFTER `role`,
ADD COLUMN `email` varchar(255) DEFAULT NULL COMMENT '登录邮箱' AFTER `department_id`,
ADD COLUMN `password_hash` varchar(255) DEFAULT NULL COMMENT '登录密码哈希' AFTER `email`,
ADD COLUMN `phone` varchar(20) DEFAULT NULL COMMENT '手机号码' AFTER `password_hash`,
ADD COLUMN `avatar` varchar(500) DEFAULT NULL COMMENT '头像URL' AFTER `phone`,
ADD COLUMN `status` tinyint DEFAULT 1 COMMENT '状态: 1=在职, 0=离职' AFTER `avatar`,
ADD COLUMN `hire_date` date DEFAULT NULL COMMENT '入职日期' AFTER `status`,
ADD COLUMN `last_login` timestamp NULL DEFAULT NULL COMMENT '最后登录时间' AFTER `hire_date`,
ADD COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间' AFTER `last_login`,
ADD COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`;

-- 添加外键约束
ALTER TABLE `employees` 
ADD CONSTRAINT `fk_employees_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加索引
ALTER TABLE `employees` 
ADD UNIQUE KEY `email` (`email`),
ADD KEY `idx_role_id` (`role_id`),
ADD KEY `idx_status` (`status`),
ADD KEY `idx_department_status` (`department_id`, `status`);

-- 4. 更新现有员工数据，设置默认角色
UPDATE `employees` SET 
    `role_id` = (SELECT id FROM roles WHERE role_code = 'employee' LIMIT 1),
    `email` = CONCAT(LOWER(name), '@company.com'),
    `password_hash` = '$2b$12$LQv3c1yqBwEHXw.9UdnJKOsG5ZK8YE5i1zJgqvVJf8Qh4.6J8.V8O', -- 默认密码: 123456
    `status` = 1,
    `hire_date` = '2024-01-01'
WHERE `role_id` IS NULL;

-- 5. 设置特定员工的角色（示例）
UPDATE `employees` SET `role_id` = (SELECT id FROM roles WHERE role_code = 'admin' LIMIT 1) WHERE `name` = '王磊';
UPDATE `employees` SET `role_id` = (SELECT id FROM roles WHERE role_code = 'project_manager' LIMIT 1) WHERE `name` IN ('张三', '李四');

-- 6. 创建用户会话表（可选，用于记录登录状态）
CREATE TABLE `user_sessions` (
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
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_sessions_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户会话表';

-- 7. 查看更新后的表结构
-- DESCRIBE employees;
-- DESCRIBE roles;
-- DESCRIBE user_sessions;

-- 8. 查看角色数据
-- SELECT * FROM roles;

-- 9. 查看员工数据（不显示密码）
-- SELECT id, name, role, role_id, email, phone, status, hire_date, last_login FROM employees;
