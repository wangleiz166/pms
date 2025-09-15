from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG
from datetime import datetime, timedelta
import calendar

app = Flask(__name__)
CORS(app)  # 为整个应用启用CORS

def get_db_connection():
    """创建并返回数据库连接"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL database: {e}")
        return None

@app.route('/api/db-test')
def db_test():
    """测试数据库连接"""
    conn = get_db_connection()
    if conn and conn.is_connected():
        conn.close()
        return jsonify({'status': 'success', 'message': 'Database connection successful.'})
    else:
        return jsonify({'status': 'error', 'message': 'Database connection failed.'}), 500

# 人员管理API
@app.route('/api/employees', methods=['GET'])
def get_employees():
    """获取员工列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '', type=str)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 构建查询条件
        where_clause = ""
        params = []
        if search:
            where_clause = "WHERE e.name LIKE %s OR d.dept_name LIKE %s"
            params = [f'%{search}%', f'%{search}%']
        
        # 获取总数
        count_query = f"""
            SELECT COUNT(*) 
            FROM employees e 
            LEFT JOIN departments d ON e.department_id = d.id 
            {where_clause}
        """
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # 计算分页
        offset = (page - 1) * per_page
        total_pages = (total + per_page - 1) // per_page
        
        # 获取员工数据
        query = f"""
            SELECT e.id, e.name, e.role, d.dept_name as department
            FROM employees e 
            LEFT JOIN departments d ON e.department_id = d.id 
            {where_clause}
            ORDER BY e.id DESC 
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [per_page, offset])
        employees = cursor.fetchall()
        
        # 转换为字典格式
        employee_list = []
        for emp in employees:
            employee_list.append({
                'id': emp[0],
                'name': emp[1],
                'role': emp[2] or '未设置',
                'department': emp[3] or '未分配部门'
            })
        
        return jsonify({
            'employees': employee_list,
            'total': total,
            'page': page,
            'pages': total_pages
        })
        
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/departments', methods=['GET'])
def get_departments():
    """获取部门列表"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, dept_name FROM departments ORDER BY dept_name")
        departments = cursor.fetchall()
        return jsonify([{'id': dept[0], 'name': dept[1]} for dept in departments])
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/projects', methods=['GET'])
def get_projects():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, project_code, project_name, status FROM projects WHERE project_code <> 'P000000000000' ORDER BY project_code")
        projects = cursor.fetchall()
        return jsonify(projects)
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """更新项目信息"""
    data = request.get_json()
    project_name = data['project_name']
    status = data['status']

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE projects SET project_name = %s, status = %s WHERE id = %s", (project_name, status, project_id))
        conn.commit()
        return jsonify({'message': 'Project updated successfully'}), 200
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/projects/detailed', methods=['GET'])
def get_projects_detailed():
    """获取项目管理的详细信息"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'message': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # 使用 LEFT JOIN 和 GROUP BY 优化查询，一次性获取所有数据
        query = """
            SELECT 
                p.id,
                p.project_code,
                p.project_name,
                p.status
            FROM 
                projects p
            WHERE
                p.project_code <> 'P000000000000'
            GROUP BY
                p.id, p.project_code, p.project_name, p.status
            ORDER BY 
                p.project_code;
        """
        cursor.execute(query)
        projects = cursor.fetchall()

        # 返回包含分页信息的对象
        return jsonify({
            'projects': projects,
            'total': len(projects),
            'page': 1,
            'pages': 1
        })

    except Error as e:
        print(f"Database error in get_projects_detailed: {e}")
        return jsonify({'message': f'An error occurred: {e}'}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/reports', methods=['POST'])
def submit_report():
    """接收并存储报工数据"""
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """INSERT INTO work_reports (employee_id, project_id, task_description, hours_spent, report_date, status)
                 VALUES (%s, %s, %s, %s, %s, %s)"""
        cursor.execute(query, (data['employee_id'], data['project_id'], data['task_description'], data['hours_spent'], data['report_date'], 0))
        conn.commit()
        return jsonify({'message': 'Report created successfully'}), 201
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/reports', methods=['GET'])
def get_reports():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
        SELECT 
            wr.id, 
            e.name as employee_name, 
            p.project_name, 
            wr.task_description, 
            wr.hours_spent, 
            wr.report_date,
            wr.status
        FROM work_reports wr
        JOIN employees e ON wr.employee_id = e.id
        JOIN projects p ON wr.project_id = p.id
        WHERE wr.employee_id = %s
        ORDER BY wr.report_date DESC
        """
        cursor.execute(query, (1,))
        reports = cursor.fetchall()
        for report in reports:
            if 'report_date' in report and report['report_date']:
                report['report_date'] = report['report_date'].isoformat()
        return jsonify(reports)
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/reports/<date>', methods=['GET'])
def get_reports_by_date(date):
    """根据日期获取报工详情"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
        SELECT 
            wr.id, 
            e.name as employee_name, 
            p.project_code,
            p.project_name, 
            wr.task_description, 
            wr.hours_spent, 
            wr.report_date,
            wr.status
        FROM work_reports wr
        JOIN employees e ON wr.employee_id = e.id
        JOIN projects p ON wr.project_id = p.id
        WHERE wr.report_date = %s AND wr.employee_id = %s
        ORDER BY wr.id DESC
        """
        cursor.execute(query, (date, 1))
        reports = cursor.fetchall()
        for report in reports:
            if 'report_date' in report and report['report_date']:
                report['report_date'] = report['report_date'].isoformat()
        return jsonify(reports)
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/stats/<year>/<month>', methods=['GET'])
def get_monthly_stats(year, month):
    """获取指定年月的统计信息"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 构建日期范围
        month_int = int(month)
        start_date = f"{year}-{month_int:0>2}-01"
        # 计算月末日期
        if month_int in [1, 3, 5, 7, 8, 10, 12]:
            end_date = f"{year}-{month_int:0>2}-31"
        elif month_int in [4, 6, 9, 11]:
            end_date = f"{year}-{month_int:0>2}-30"
        else:  # 2月
            if int(year) % 4 == 0 and (int(year) % 100 != 0 or int(year) % 400 == 0):
                end_date = f"{year}-{month_int:0>2}-29"  # 闰年
            else:
                end_date = f"{year}-{month_int:0>2}-28"  # 平年
        
        # 获取本月工时统计
        cursor.execute("""
            SELECT 
                COALESCE(SUM(hours_spent), 0) as total_hours,
                COALESCE(COUNT(DISTINCT project_id), 0) as project_count,
                COALESCE(COUNT(DISTINCT DATE(report_date)), 0) as working_days
            FROM work_reports 
            WHERE report_date >= %s AND report_date <= %s
        """, (start_date, end_date))
        
        stats = cursor.fetchone()
        
        # 计算本月总天数
        import calendar
        total_days = calendar.monthrange(int(year), month_int)[1]
        
        # 计算填报率（工作日天数 / 本月总天数）
        fill_rate = round((stats['working_days'] / total_days) * 100, 1) if total_days > 0 else 0
        
        # 计算人天（工时 / 8）
        total_days_worked = round(stats['total_hours'] / 8, 1)
        
        result = {
            'total_hours': float(stats['total_hours']),
            'total_days_worked': total_days_worked,
            'project_count': stats['project_count'],
            'fill_rate': fill_rate,
            'working_days': stats['working_days'],
            'total_days': total_days
        }
        
        return jsonify(result)
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/reports/pending', methods=['GET'])
def get_pending_reports():
    """获取待审核的报工记录（分页）"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 获取分页参数
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page
        
        # 获取待审核的报工记录总数
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM work_reports 
            WHERE status = 0 AND employee_id = %s
        """, (1,))
        total_count = cursor.fetchone()['total']
        
        # 获取待审核的报工记录（分页）
        cursor.execute("""
            SELECT 
                wr.id,
                wr.employee_id,
                wr.project_id,
                wr.task_description,
                wr.hours_spent,
                wr.report_date,
                wr.status,
                e.name as employee_name,
                p.project_code,
                p.project_name
            FROM work_reports wr
            JOIN employees e ON wr.employee_id = e.id
            JOIN projects p ON wr.project_id = p.id
            WHERE wr.status = 0 AND wr.employee_id = %s
            ORDER BY wr.report_date DESC, wr.id DESC
            LIMIT %s OFFSET %s
        """, (1, per_page, offset))
        
        reports = cursor.fetchall()
        
        # 格式化日期
        for report in reports:
            if 'report_date' in report and report['report_date']:
                report['report_date'] = report['report_date'].isoformat()
        
        # 计算分页信息
        total_pages = (total_count + per_page - 1) // per_page
        
        result = {
            'reports': reports,
            'pagination': {
                'current_page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }
        
        return jsonify(result)
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/reports/<int:report_id>/approve', methods=['POST'])
def approve_report(report_id):
    """审核通过报工记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE work_reports SET status = 1 WHERE id = %s", (report_id,))
        conn.commit()
        return jsonify({'message': 'Report approved successfully'}), 200
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/reports/<int:report_id>/reject', methods=['POST'])
def reject_report(report_id):
    """审核驳回报工记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE work_reports SET status = 2 WHERE id = %s", (report_id,))
        conn.commit()
        return jsonify({'message': 'Report rejected successfully'}), 200
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/reports/analysis', methods=['GET'])
def get_reports_analysis():
    """获取报工分析数据，支持多种筛选条件"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 获取查询参数
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        time_range = request.args.get('time_range', 'current_month')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        project_id = request.args.get('project_id')
        employee_id = request.args.get('employee_id')
        
        # 构建WHERE条件
        where_conditions = []
        params = []
        
        if time_range == 'custom' and start_date and end_date:
            where_conditions.append("wr.report_date BETWEEN %s AND %s")
            params.extend([start_date, end_date])
        elif time_range == 'current_month':
            # 默认查询8月数据，因为当前数据都在8月
            start_date = "2025-08-01"
            end_date = "2025-08-31"
            where_conditions.append("wr.report_date BETWEEN %s AND %s")
            params.extend([start_date, end_date])
        elif time_range == 'last_month':
            # 查询7月数据
            start_date = "2025-07-01"
            end_date = "2025-07-31"
            where_conditions.append("wr.report_date BETWEEN %s AND %s")
            params.extend([start_date, end_date])
        elif time_range == 'last_3_months':
            # 查询6-8月数据
            start_date = "2025-06-01"
            end_date = "2025-08-31"
            where_conditions.append("wr.report_date BETWEEN %s AND %s")
            params.extend([start_date, end_date])
        elif time_range == 'last_6_months':
            # 查询3-8月数据
            start_date = "2025-03-01"
            end_date = "2025-08-31"
            where_conditions.append("wr.report_date BETWEEN %s AND %s")
            params.extend([start_date, end_date])
        elif time_range == 'current_year':
            # 查询2025年全年数据
            start_date = "2025-01-01"
            end_date = "2025-12-31"
            where_conditions.append("wr.report_date BETWEEN %s AND %s")
            params.extend([start_date, end_date])
        
        if project_id:
            where_conditions.append("wr.project_id = %s")
            params.append(project_id)
        
        if employee_id:
            where_conditions.append("wr.employee_id = %s")
            params.append(employee_id)
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        # 获取总记录数
        count_query = f"""
            SELECT COUNT(*) as total
            FROM work_reports wr
            JOIN employees e ON wr.employee_id = e.id
            JOIN projects p ON wr.project_id = p.id
            WHERE {where_clause}
        """
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()['total']
        
        # 计算分页
        total_pages = (total_count + per_page - 1) // per_page
        offset = (page - 1) * per_page
        
        # 获取分页数据
        query = f"""
            SELECT
                wr.id,
                wr.report_date,
                e.name as employee_name,
                p.project_name,
                wr.task_description,
                wr.hours_spent,
                wr.status,
                wr.created_at
            FROM work_reports wr
            JOIN employees e ON wr.employee_id = e.id
            JOIN projects p ON wr.project_id = p.id
            WHERE {where_clause}
            ORDER BY wr.report_date DESC
            LIMIT %s OFFSET %s
        """
        params.extend([per_page, offset])
        cursor.execute(query, params)
        reports = cursor.fetchall()
        
        # 计算KPI指标
        kpi_query = f"""
            SELECT
                COALESCE(SUM(wr.hours_spent), 0) as total_hours,
                COALESCE(COUNT(DISTINCT DATE(wr.report_date)), 0) as total_days,
                COALESCE(SUM(wr.hours_spent) / 8, 0) as total_days_worked,
                COALESCE(AVG(wr.hours_spent), 0) as avg_hours_per_day,
                COALESCE(COUNT(DISTINCT wr.employee_id), 0) as employee_count,
                COALESCE(COUNT(DISTINCT wr.project_id), 0) as project_count,
                COALESCE(COUNT(DISTINCT DATE(wr.report_date)), 0) as working_days
            FROM work_reports wr
            WHERE {where_clause}
        """
        cursor.execute(kpi_query, params[:-2])  # 移除LIMIT和OFFSET参数
        kpi_data = cursor.fetchone()
        
        # 计算填报率（基于工作天数）
        if kpi_data['working_days'] > 0:
            # 假设一个月有22个工作日
            month_working_days = 22
            fill_rate = (kpi_data['working_days'] / month_working_days) * 100
        else:
            fill_rate = 0
        
        kpi = {
            'total_hours': float(kpi_data['total_hours']),
            'total_days': float(kpi_data['total_days_worked']),
            'avg_hours_per_day': float(kpi_data['avg_hours_per_day']),
            'fill_rate': round(fill_rate, 1),
            'employee_count': kpi_data['employee_count'],
            'project_count': kpi_data['project_count'],
            'working_days': kpi_data['working_days']
        }
        
        pagination = {
            'current_page': page,
            'per_page': per_page,
            'total_count': total_count,
            'total_pages': total_pages,
            'has_prev': page > 1,
            'has_next': page < total_pages
        }
        
        return jsonify({
            'reports': reports,
            'pagination': pagination,
            'kpi': kpi
        })
        
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/charts/hours-trend', methods=['GET'])
def get_hours_trend_chart():
    """获取工时趋势图数据"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 获取最近6个月的数据
        months = []
        hours_data = []
        
        for i in range(6):
            date = datetime.now() - timedelta(days=30*i)
            month_start = date.replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            cursor.execute("""
                SELECT COALESCE(SUM(hours_spent), 0) as total_hours
                FROM work_reports 
                WHERE report_date BETWEEN %s AND %s
            """, (month_start.strftime('%Y-%m-%d'), month_end.strftime('%Y-%m-%d')))
            
            result = cursor.fetchone()
            months.append(month_start.strftime('%Y-%m'))
            hours_data.append(float(result['total_hours']))
        
        # 反转数组，使最新的月份在右边
        months.reverse()
        hours_data.reverse()
        
        return jsonify({
            'months': months,
            'hours': hours_data
        })
        
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/charts/project-progress', methods=['GET'])
def get_project_progress_chart():
    """获取项目进度图数据"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                p.project_name,
                COALESCE(SUM(wr.hours_spent), 0) as total_hours,
                p.status
            FROM projects p
            LEFT JOIN work_reports wr ON p.id = wr.project_id
            GROUP BY p.id, p.project_name, p.status
            ORDER BY total_hours DESC
        """)
        
        projects = cursor.fetchall()
        
        # 计算项目进度
        for project in projects:
            if project['status'] == 'Completed':
                project['progress'] = 100
            elif project['status'] == 'Active':
                # 基于工时估算进度
                project['progress'] = min(project['total_hours'] * 2, 90)
            else:
                project['progress'] = 0
        
        return jsonify(projects)
        
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/charts/team-efficiency', methods=['GET'])
def get_team_efficiency_chart():
    """获取团队效率图数据"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                e.name as employee_name,
                COALESCE(SUM(wr.hours_spent), 0) as total_hours,
                COALESCE(COUNT(DISTINCT DATE(wr.report_date)), 0) as working_days,
                COALESCE(COUNT(DISTINCT wr.project_id), 0) as project_count
            FROM employees e
            LEFT JOIN work_reports wr ON e.id = wr.employee_id
            WHERE wr.report_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY e.id, e.name
            ORDER BY total_hours DESC
        """)
        
        employees = cursor.fetchall()
        
        # 计算效率指标
        for employee in employees:
            if employee['working_days'] > 0:
                employee['avg_hours_per_day'] = round(employee['total_hours'] / employee['working_days'], 1)
                employee['efficiency_score'] = round((employee['total_hours'] / 160) * 100, 1)  # 假设标准月工时160小时
            else:
                employee['avg_hours_per_day'] = 0
                employee['efficiency_score'] = 0
        
        return jsonify(employees)
        
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/charts/financial-analysis', methods=['GET'])
def get_financial_analysis_chart():
    """获取财务分析图数据（模拟数据）"""
    try:
        # 模拟财务数据
        months = ['2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08']
        revenue = [120000, 135000, 142000, 158000, 165000, 172000]
        expenses = [95000, 102000, 108000, 115000, 122000, 128000]
        profit = [r - e for r, e in zip(revenue, expenses)]
        
        return jsonify({
            'months': months,
            'revenue': revenue,
            'expenses': expenses,
            'profit': profit
        })
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/')
def hello_world():
    return 'Hello, from Flask Backend!'

if __name__ == '__main__':
    app.run(debug=True, port=5001) # 使用一个不同的端口以避免与前端冲突

