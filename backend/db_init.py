import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG

def setup_database():
    """创建所有需要的表并插入初始数据"""
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        print("Creating tables...")

        # 创建 employees 表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            role VARCHAR(100)
        )
        """)
        print("Table 'employees' created or already exists.")

        # 创建 projects 表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_code VARCHAR(100) NOT NULL UNIQUE,
            project_name VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'Active'
        )
        """)
        print("Table 'projects' created or already exists.")

        # 修改 work_reports 表 (先删除旧的，再创建新的)
        cursor.execute("DROP TABLE IF EXISTS work_reports")
        cursor.execute("""
        CREATE TABLE work_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            project_id INT NOT NULL,
            task_description TEXT NOT NULL,
            hours_spent DECIMAL(5, 2) NOT NULL,
            report_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
        """)
        print("Table 'work_reports' created successfully.")

        # 插入初始数据
        print("Seeding data...")
        seed_data(cursor)
        conn.commit()
        print("Data seeding completed.")

    except Error as e:
        print(f"Database setup error: {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            print("Database connection closed.")

def seed_data(cursor):
    """插入初始员工和项目数据"""
    employees_to_add = [
        ('王磊', '开发工程师'),
        ('李四', '项目经理'),
        ('张三', '测试工程师')
    ]
    cursor.executemany("INSERT IGNORE INTO employees (name, role) VALUES (%s, %s)", employees_to_add)

    projects_to_add = [
        ('P202501DP0001', 'DP-银联数据三期', 'Active'),
        ('P202501INP0001', 'IN-PM-系统开发和运维2025', 'Active'),
        ('P202501INP0003', 'IN-IT-内部管理2025', 'Completed')
    ]
    cursor.executemany("INSERT IGNORE INTO projects (project_code, project_name, status) VALUES (%s, %s, %s)", projects_to_add)

if __name__ == '__main__':
    setup_database()
