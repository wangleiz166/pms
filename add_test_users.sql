-- 添加测试用户数据
-- 使用当前的employees表结构

-- 插入测试用户（使用INSERT IGNORE避免重复插入）
INSERT IGNORE INTO `employees` (`name`, `role`, `department_id`, `email`, `password_hash`, `phone`, `status`, `hire_date`) VALUES
('王磊', '系统管理员', 1, 'wanglei@pintechs.com', 'dummy_hash', '13800138001', 1, '2024-01-01'),
('张三', '项目经理', 1, 'zhangsan@company.com', 'dummy_hash', '13800138002', 1, '2024-01-15'),
('李四', '开发工程师', 1, 'lisi@company.com', 'dummy_hash', '13800138003', 1, '2024-02-01'),
('王五', '测试工程师', 2, 'wangwu@company.com', 'dummy_hash', '13800138004', 1, '2024-02-15'),
('赵六', '产品经理', 3, 'zhaoliu@company.com', 'dummy_hash', '13800138005', 1, '2024-03-01');

-- 查看插入的用户
SELECT id, name, email, role, department_id, status FROM employees;
