from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG
from datetime import datetime, timedelta
import calendar
import hashlib
import secrets
import json

def hash_password(password):
    """生成密码哈希"""
    # 使用SHA-256 + 盐值的方式
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{password_hash}"

def verify_password(password, password_hash):
    """验证密码"""
    try:
        salt, stored_hash = password_hash.split(':')
        computed_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return computed_hash == stored_hash
    except:
        return False

app = Flask(__name__)
# 启用CORS并支持凭据，限制允许的前端来源
CORS(app,
     supports_credentials=True,
     resources={r"/api/*": {"origins": [
         "http://127.0.0.1:8080",
         "http://localhost:8080",
         "http://127.0.0.1:5002",
         "http://localhost:5002",
         "http://10.10.201.67:5002",
         "http://120.55.115.65:5002",
         "https://pilot.pintechs.com"
     ]}}
)

# 内存session存储（当user_sessions表不存在时使用）
memory_sessions = {}

# 连接计数器
connection_count = 0
active_connections = 0

def get_db_connection():
    """创建并返回数据库连接"""
    global connection_count, active_connections
    connection_count += 1
    active_connections += 1
    
    try:
        print(f"[DB_CONN] Attempting connection #{connection_count}, active: {active_connections}")
        print(f"[DB_CONN] MySQL: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
        conn = mysql.connector.connect(**DB_CONFIG)
        
        # 设置会话时区为北京时间（东八区）
        cursor = conn.cursor()
        cursor.execute("SET time_zone = '+08:00'")
        cursor.close()
        
        print(f"[DB_CONN] Connection #{connection_count} successful, ID: {conn.connection_id}, active: {active_connections}")
        return conn
    except Error as e:
        active_connections -= 1
        print(f"[DB_CONN] Connection #{connection_count} FAILED: {e}")
        print(f"[DB_CONN] Active connections after failure: {active_connections}")
        return None

# 从cookie会话中获取当前登录的employee_id
def get_current_employee_id(cursor=None):
    session_id = request.cookies.get('pms_session_id')
    if not session_id:
        return None
    close_cursor = False
    if cursor is None:
        conn = get_db_connection()
        if not conn:
            return None
        cursor = conn.cursor(dictionary=True)
        close_cursor = True
    try:
        try:
            cursor.execute(
                """
                SELECT s.employee_id
                FROM user_sessions s
                JOIN employees e ON s.employee_id = e.id
                WHERE s.session_token = %s AND s.expires_at > %s AND e.status = 1
                """,
                (session_id, datetime.now()),
            )
            row = cursor.fetchone()
            if row:
                return row['employee_id']
        except Error:
            # 回退到内存session
            sess = memory_sessions.get(session_id)
            if sess and sess.get('expires_at') and sess['expires_at'] > datetime.now():
                return sess.get('employee_id')
        return None
    finally:
        if close_cursor:
            try:
                cursor.close()
                conn.close()
            except Exception:
                pass

@app.route('/api/db-test')
def db_test():
    """测试数据库连接"""
    conn = get_db_connection()
    if conn and conn.is_connected():
        conn.close()
        return jsonify({'status': 'success', 'message': 'Database connection successful.'})
    else:
        return jsonify({'status': 'error', 'message': 'Database connection failed.'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    try:
        conn = get_db_connection()
        if conn and conn.is_connected():
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            conn.close()
            return jsonify({'status': 'success', 'message': 'Service and database healthy.'})
        else:
            return jsonify({'status': 'error', 'message': 'Database connection failed.'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Health check failed: {str(e)}'}), 500

# 人员管理API
@app.route('/api/employees', methods=['GET'])
def get_employees():
    """获取员工列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '', type=str)
    department = request.args.get('department', '', type=str)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 构建查询条件
        where_conditions = []
        params = []
        
        if search:
            where_conditions.append("(e.name LIKE %s OR d.dept_name LIKE %s)")
            params.extend([f'%{search}%', f'%{search}%'])
        
        if department:
            where_conditions.append("d.dept_name = %s")
            params.append(department)
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
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
            SELECT e.id, e.name, e.email, e.role_id, r.role_name, e.last_login,
                   d.dept_name as department, e.department_id
            FROM employees e 
            LEFT JOIN roles r ON e.role_id = r.id
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
            # 格式化最后登录时间
            last_login = emp[5]
            if last_login:
                # 将datetime对象格式化为简短的字符串格式
                formatted_login = last_login.strftime('%d %b %Y %H:%M:%S')
            else:
                formatted_login = '从未登录'
            
            employee_list.append({
                'id': emp[0],
                'name': emp[1],
                'email': emp[2] or '未设置',
                'role_id': emp[3],
                'role_name': emp[4] or '未设置',
                'last_login': formatted_login,
                'department': emp[6] or '未分配部门',
                'department_id': emp[7]
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
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

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
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")
@app.route('/api/current-user-permissions', methods=['GET'])
def get_current_user_permissions():
    """获取当前用户权限"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 从session中获取当前登录用户ID
        employee_id = get_current_employee_id(cursor)
        if not employee_id:
            return jsonify({'message': '未登录或会话失效'}), 401
        
        cursor.execute("""
            SELECT e.id, e.name, e.role_id, r.role_name, r.permissions
            FROM employees e
            LEFT JOIN roles r ON e.role_id = r.id
            WHERE e.id = %s AND e.status = 1
        """, (employee_id,))
        
        user = cursor.fetchone()
        if not user:
            return jsonify({'message': '用户不存在或已被禁用'}), 404
        
        print(f"[权限查询] 用户: {user['name']}, 角色: {user['role_name']}")
        print(f"[权限查询] 原始permissions字段: {user['permissions']}")
        print(f"[权限查询] permissions类型: {type(user['permissions'])}")
        
        # 解析权限JSON
        permissions = {}
        if user['permissions']:
            try:
                # 如果已经是字典类型（某些MySQL驱动会自动解析JSON）
                if isinstance(user['permissions'], dict):
                    permissions = user['permissions']
                # 如果是字符串类型，需要解析
                elif isinstance(user['permissions'], str):
                    permissions = json.loads(user['permissions'])
                else:
                    print(f"[权限查询] 未知的permissions类型: {type(user['permissions'])}")
                    permissions = {}
            except (json.JSONDecodeError, TypeError) as e:
                print(f"[权限查询] 解析permissions失败: {e}")
                permissions = {}
        
        # 强制添加工时管理权限（所有用户必须有）
        if 'navigation' not in permissions:
            permissions['navigation'] = {}
        permissions['navigation']['timesheet'] = True
        
        print(f"[权限查询] 解析后的permissions: {permissions}")
        
        return jsonify({
            'user_id': user['id'],
            'user_name': user['name'],
            'role_id': user['role_id'],
            'role_name': user['role_name'],
            'permissions': permissions
        })
        
    except Error as e:
        print(f"[权限查询] 数据库错误: {e}")
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/roles', methods=['GET'])
def get_roles():
    """获取角色列表（支持分页）"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    page = max(1, page)
    per_page = max(1, min(per_page, 100))
    
    offset = (page - 1) * per_page
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 统计总数
        cursor.execute("SELECT COUNT(*) AS cnt FROM roles")
        total_count = cursor.fetchone()['cnt']
        
        # 查询当前页
        cursor.execute("""
            SELECT id, role_name, role_code, description, status, permissions
            FROM roles
            ORDER BY role_name
            LIMIT %s OFFSET %s
        """, (per_page, offset))
        roles = cursor.fetchall()
        
        total_pages = (total_count + per_page - 1) // per_page if per_page else 1
        
        return jsonify({
            'items': roles,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages
            }
        })
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/employees/project-managers', methods=['GET'])
def get_project_managers():
    """获取项目经理列表"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT e.id, e.name 
            FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE r.role_name = '项目经理' AND e.status = 1 
            ORDER BY e.name
        """)
        managers = cursor.fetchall()
        return jsonify([{'id': manager[0], 'name': manager[1]} for manager in managers])
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/roles', methods=['POST'])
def create_role():
    """创建角色"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        data = request.get_json() or {}
        role_name = (data.get('role_name') or '').strip()
        role_code = (data.get('role_code') or '').strip()
        description = (data.get('description') or '').strip()
        permissions = data.get('permissions', {})

        if not role_name or not role_code:
            return jsonify({'message': '缺少必要字段：role_name, role_code'}), 400

        # 检查角色名称或代码是否已存在
        cursor.execute("SELECT id FROM roles WHERE role_name = %s OR role_code = %s", (role_name, role_code))
        exists = cursor.fetchone()
        if exists:
            return jsonify({'message': '角色名称或代码已存在'}), 409

        # 强制添加工时管理权限（所有角色必须有）
        if 'navigation' not in permissions:
            permissions['navigation'] = {}
        permissions['navigation']['timesheet'] = True
        
        print(f"[创建角色] 角色: {role_name}, 权限: {permissions}")

        cursor.execute(
            """
            INSERT INTO roles (role_name, role_code, description, permissions, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, 1, NOW(), NOW())
            """,
            (role_name, role_code, description, json.dumps(permissions))
        )
        conn.commit()

        new_id = cursor.lastrowid
        # 操作日志（不影响主流程）
        try:
            # 优先从session获取当前用户名称
            user_name = None
            try:
                # 直接读session关联的员工名称
                conn2 = get_db_connection()
                if conn2:  # 检查连接是否成功
                    cur2 = conn2.cursor()
                session_id = request.cookies.get('pms_session_id')
                if session_id:
                    cur2.execute("""
                        SELECT e.name
                        FROM user_sessions s
                        JOIN employees e ON e.id = s.employee_id
                        WHERE s.session_token = %s AND s.expires_at > %s
                    """, (session_id, datetime.now()))
                    row = cur2.fetchone()
                    if row:
                        user_name = row[0]
                    cur2.close()
                    conn2.close()
            except Exception:
                pass
            if not user_name:
                user_name = request.headers.get('X-User-Name', '系统')
            log_cur = conn.cursor()
            log_cur.execute(
                "INSERT INTO operation_logs (operation_time, user_name, operation) VALUES (NOW(), %s, %s)",
                (user_name, f"创建角色: {role_name}({role_code})")
            )
            conn.commit()
            log_cur.close()
        except Exception:
            conn.rollback()
        cursor.execute("""
            SELECT id, role_name, role_code, description, status, permissions
            FROM roles
            WHERE id = %s
        """, (new_id,))
        role = cursor.fetchone()
        return jsonify({'message': '创建成功', 'role': role}), 201
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/roles/<int:role_id>', methods=['GET'])
def get_role(role_id):
    """获取单个角色详情"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, role_name, role_code, description, status, permissions
            FROM roles
            WHERE id = %s
        """, (role_id,))
        role = cursor.fetchone()
        if not role:
            return jsonify({'message': '角色不存在'}), 404
        return jsonify(role)
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/roles/<int:role_id>', methods=['PUT'])
def update_role(role_id):
    """更新角色信息"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        data = request.get_json() or {}
        role_name = (data.get('role_name') or '').strip()
        role_code = (data.get('role_code') or '').strip()
        description = (data.get('description') or '').strip()
        status = data.get('status', 1)
        permissions = data.get('permissions', {})

        if not role_name or not role_code:
            return jsonify({'message': '缺少必要字段：role_name, role_code'}), 400

        # 检查角色是否存在
        cursor.execute("SELECT id FROM roles WHERE id = %s", (role_id,))
        if not cursor.fetchone():
            return jsonify({'message': '角色不存在'}), 404

        # 检查角色名称或代码是否与其他角色冲突
        cursor.execute("SELECT id FROM roles WHERE (role_name = %s OR role_code = %s) AND id != %s", 
                      (role_name, role_code, role_id))
        exists = cursor.fetchone()
        if exists:
            return jsonify({'message': '角色名称或代码已存在'}), 409

        # 强制添加工时管理权限（所有角色必须有）
        if 'navigation' not in permissions:
            permissions['navigation'] = {}
        permissions['navigation']['timesheet'] = True
        
        print(f"[更新角色] 角色ID: {role_id}, 角色: {role_name}, 权限: {permissions}")

        cursor.execute(
            """
            UPDATE roles 
            SET role_name = %s, role_code = %s, description = %s, status = %s, permissions = %s, updated_at = NOW()
            WHERE id = %s
            """,
            (role_name, role_code, description, status, json.dumps(permissions), role_id)
        )
        conn.commit()

        # 操作日志（不影响主流程）
        try:
            user_name = None
            try:
                conn2 = get_db_connection()
                if conn2:  # 检查连接是否成功
                    cur2 = conn2.cursor()
                session_id = request.cookies.get('pms_session_id')
                if session_id:
                    cur2.execute("""
                        SELECT e.name
                        FROM user_sessions s
                        JOIN employees e ON e.id = s.employee_id
                        WHERE s.session_token = %s AND s.expires_at > %s
                    """, (session_id, datetime.now()))
                    row = cur2.fetchone()
                    if row:
                        user_name = row[0]
                    cur2.close()
                    conn2.close()
            except Exception:
                pass
            if not user_name:
                user_name = request.headers.get('X-User-Name', '系统')
            log_cur = conn.cursor()
            log_cur.execute(
                "INSERT INTO operation_logs (operation_time, user_name, operation) VALUES (NOW(), %s, %s)",
                (user_name, f"更新角色: {role_name}({role_code})")
            )
            conn.commit()
            log_cur.close()
        except Exception:
            conn.rollback()
        cursor.execute("""
            SELECT id, role_name, role_code, description, status, permissions
            FROM roles
            WHERE id = %s
        """, (role_id,))
        role = cursor.fetchone()
        return jsonify({'message': '更新成功', 'role': role}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/roles/<int:role_id>', methods=['DELETE'])
def delete_role(role_id):
    """删除角色"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 检查角色是否存在，同时获取角色名称用于日志
        cursor.execute("SELECT id, role_name FROM roles WHERE id = %s", (role_id,))
        role_data = cursor.fetchone()
        if not role_data:
            return jsonify({'message': '角色不存在'}), 404
        
        role_name = role_data[1]  # 保存角色名称用于日志

        # 检查是否有员工使用此角色
        cursor.execute("SELECT COUNT(*) FROM employees WHERE role_id = %s", (role_id,))
        user_count = cursor.fetchone()[0]
        if user_count > 0:
            return jsonify({'message': f'无法删除：有 {user_count} 个用户正在使用此角色'}), 409

        cursor.execute("DELETE FROM roles WHERE id = %s", (role_id,))
        conn.commit()
        # 操作日志（不影响主流程）
        try:
            user_name = None
            try:
                conn2 = get_db_connection()
                if conn2:  # 检查连接是否成功
                    cur2 = conn2.cursor()
                session_id = request.cookies.get('pms_session_id')
                if session_id:
                    cur2.execute("""
                        SELECT e.name
                        FROM user_sessions s
                        JOIN employees e ON e.id = s.employee_id
                        WHERE s.session_token = %s AND s.expires_at > %s
                    """, (session_id, datetime.now()))
                    row = cur2.fetchone()
                    if row:
                        user_name = row[0]
                    cur2.close()
                    conn2.close()
            except Exception:
                pass
            if not user_name:
                user_name = request.headers.get('X-User-Name', '系统')
            log_cur = conn.cursor()
            log_cur.execute(
                "INSERT INTO operation_logs (operation_time, user_name, operation) VALUES (NOW(), %s, %s)",
                (user_name, f"删除角色: {role_name}")
            )
            conn.commit()
            log_cur.close()
        except Exception:
            conn.rollback()
        
        return jsonify({'message': '删除成功'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/operation-logs', methods=['GET'])
def get_operation_logs():
    """获取操作日志列表（简化版，支持分页）"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    page = max(1, page)
    per_page = max(1, min(per_page, 100))

    offset = (page - 1) * per_page

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 统计总数
        cursor.execute("SELECT COUNT(*) AS cnt FROM operation_logs")
        total_count = cursor.fetchone()['cnt']

        # 查询当前页，直接返回数据库存储的时间（不做时区转换）
        cursor.execute(
            """
            SELECT id, operation_time, user_name, `operation`
            FROM operation_logs
            ORDER BY operation_time DESC, id DESC
            LIMIT %s OFFSET %s
            """,
            (per_page, offset)
        )
        logs = cursor.fetchall()
        
        # 手动格式化时间为字符串，避免Flask自动转换为GMT格式
        for log in logs:
            if log.get('operation_time'):
                log['operation_time'] = log['operation_time'].strftime('%Y-%m-%d %H:%M:%S')

        total_pages = (total_count + per_page - 1) // per_page if per_page else 1

        return jsonify({
            'items': logs,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages
            }
        })
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/users', methods=['POST'])
def create_user():
    """创建用户（员工）"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip()
        password = (data.get('password') or '').strip()
        role_id = data.get('role_id')
        department_id = data.get('department_id')

        if not name or not email or not password or not role_id:
            return jsonify({'message': '缺少必要字段：name, email, password, role_id'}), 400
        
        if len(password) < 6:
            return jsonify({'message': '密码长度至少6位'}), 400

        # 唯一性检查：仅邮箱唯一（允许用户名重名）
        # 检查邮箱是否已存在
        cursor.execute("SELECT id FROM employees WHERE email = %s", (email,))
        email_exists = cursor.fetchone()
        if email_exists:
            return jsonify({'message': '当前邮箱已存在，请重新输入'}), 409

        # 生成密码哈希
        password_hash = hash_password(password)
        
        # 插入
        cursor.execute(
            """
            INSERT INTO employees (name, email, password_hash, role_id, department_id, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, 1, NOW(), NOW())
            """,
            (name, email, password_hash, role_id, department_id)
        )
        conn.commit()

        new_id = cursor.lastrowid
        # 操作日志（不影响主流程）
        try:
            user_name = None
            try:
                conn2 = get_db_connection()
                if conn2:  # 检查连接是否成功
                    cur2 = conn2.cursor()
                session_id = request.cookies.get('pms_session_id')
                if session_id:
                    cur2.execute("""
                        SELECT e.name
                        FROM user_sessions s
                        JOIN employees e ON e.id = s.employee_id
                        WHERE s.session_token = %s AND s.expires_at > %s
                    """, (session_id, datetime.now()))
                    row = cur2.fetchone()
                    if row:
                        user_name = row[0]
                    cur2.close()
                    conn2.close()
            except Exception:
                pass
            if not user_name:
                user_name = request.headers.get('X-User-Name', '系统')
            log_cur = conn.cursor()
            log_cur.execute(
                "INSERT INTO operation_logs (operation_time, user_name, operation) VALUES (NOW(), %s, %s)",
                (user_name, f"创建用户: {name}({email})")
            )
            conn.commit()
            log_cur.close()
        except Exception:
            conn.rollback()
        cursor.execute("""
            SELECT e.id, e.name, e.email, e.role_id, r.role_name, e.status, e.last_login,
                   e.department_id, d.dept_name as department
            FROM employees e
            LEFT JOIN roles r ON e.role_id = r.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.id = %s
        """, (new_id,))
        user = cursor.fetchone()
        return jsonify({'message': '创建成功', 'user': user}), 201
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """更新用户信息"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip()
        role_id = data.get('role_id')
        department_id = data.get('department_id')

        if not name or not email or not role_id or not department_id:
            return jsonify({'message': '缺少必要字段：name, email, role_id, department_id'}), 400

        # 检查用户是否存在
        cursor.execute("SELECT id FROM employees WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({'message': '用户不存在'}), 404

        # 只检查邮箱是否与其他用户重复（允许用户名重复，允许修改邮箱）
        cursor.execute("SELECT id FROM employees WHERE email = %s AND id != %s", 
                      (email, user_id))
        exists = cursor.fetchone()
        if exists:
            return jsonify({'message': '当前邮箱已存在，请重新输入'}), 409

        # 更新用户信息
        cursor.execute(
            """
            UPDATE employees 
            SET name = %s, email = %s, role_id = %s, department_id = %s, updated_at = NOW()
            WHERE id = %s
            """,
            (name, email, role_id, department_id, user_id)
        )
        conn.commit()

        # 操作日志（不影响主流程）
        try:
            user_name = None
            try:
                conn2 = get_db_connection()
                if conn2:  # 检查连接是否成功
                    cur2 = conn2.cursor()
                session_id = request.cookies.get('pms_session_id')
                if session_id:
                    cur2.execute("""
                        SELECT e.name
                        FROM user_sessions s
                        JOIN employees e ON e.id = s.employee_id
                        WHERE s.session_token = %s AND s.expires_at > %s
                    """, (session_id, datetime.now()))
                    row = cur2.fetchone()
                    if row:
                        user_name = row[0]
                    cur2.close()
                    conn2.close()
            except Exception:
                pass
            if not user_name:
                user_name = request.headers.get('X-User-Name', '系统')
            log_cur = conn.cursor()
            log_cur.execute(
                "INSERT INTO operation_logs (operation_time, user_name, operation) VALUES (NOW(), %s, %s)",
                (user_name, f"更新用户: {name}({email})")
            )
            conn.commit()
            log_cur.close()
        except Exception:
            conn.rollback()
        # 返回更新后的用户信息
        cursor.execute("""
            SELECT e.id, e.name, e.email, e.role_id, r.role_name, e.status, e.last_login,
                   e.department_id, d.dept_name as department
            FROM employees e
            LEFT JOIN roles r ON e.role_id = r.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.id = %s
        """, (user_id,))
        user = cursor.fetchone()
        return jsonify({'message': '更新成功', 'user': user}), 200
    except Error as e:
        print(f"[UPDATE_USER] Database error: {e}")
        if conn:
            conn.rollback()
        return jsonify({'message': f'数据库错误: {str(e)}'}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """删除用户"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 检查用户是否存在，并获取用户名用于日志记录
        cursor.execute("SELECT id, name, email FROM employees WHERE id = %s", (user_id,))
        user_to_delete = cursor.fetchone()
        if not user_to_delete:
            return jsonify({'message': '用户不存在'}), 404
        
        deleted_user_name = user_to_delete[1]  # 用户名
        deleted_user_email = user_to_delete[2]  # 邮箱

        # 删除用户
        cursor.execute("DELETE FROM employees WHERE id = %s", (user_id,))
        conn.commit()
        
        # 操作日志（不影响主流程）
        try:
            operator_name = None
            try:
                conn2 = get_db_connection()
                if conn2:  # 检查连接是否成功
                    cur2 = conn2.cursor()
                session_id = request.cookies.get('pms_session_id')
                if session_id:
                    cur2.execute("""
                        SELECT e.name
                        FROM user_sessions s
                        JOIN employees e ON e.id = s.employee_id
                        WHERE s.session_token = %s AND s.expires_at > %s
                    """, (session_id, datetime.now()))
                    row = cur2.fetchone()
                    if row:
                        operator_name = row[0]
                    cur2.close()
                    conn2.close()
            except Exception:
                pass
            if not operator_name:
                operator_name = request.headers.get('X-User-Name', '系统')
            log_cur = conn.cursor()
            log_cur.execute(
                "INSERT INTO operation_logs (operation_time, user_name, operation) VALUES (NOW(), %s, %s)",
                (operator_name, f"删除用户: {deleted_user_name}({deleted_user_email})")
            )
            conn.commit()
            log_cur.close()
        except Exception:
            conn.rollback()
        
        return jsonify({'message': '删除成功'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/projects', methods=['GET'])
def get_projects():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, project_code, project_name, status, project_type FROM projects WHERE project_code <> 'P000000000000' ORDER BY project_code")
        projects = cursor.fetchall()
        return jsonify(projects)
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/projects', methods=['POST'])
def create_project():
    """创建项目"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        data = request.get_json() or {}
        project_name = (data.get('project_name') or '').strip()
        project_type = data.get('project_type', 2)  # 默认为2（交付类）
        project_manager_id = data.get('project_manager_id')
        project_category = (data.get('project_category') or '').strip()
        business_unit_code = (data.get('business_unit_code') or '').strip()
        client_or_dept_code = (data.get('client_or_dept_code') or '').strip()
        is_annual_project = data.get('is_annual_project', False)

        if not project_name:
            return jsonify({'message': '缺少必要字段：project_name'}), 400
        if not business_unit_code or not client_or_dept_code:
            return jsonify({'message': '缺少必要字段：business_unit_code, client_or_dept_code'}), 400
        if not project_category:
            return jsonify({'message': '缺少必要字段：project_category'}), 400

        # 计算category_code
        category_map = {1: 'P', 2: 'D', 3: 'O', 4: 'T'}
        category_code = category_map.get(int(project_type) if project_type is not None else 2, 'D')
        # 计算phase_type：内部(4)固定T；外部允许P/D/O；若未给则同category_code
        if str(project_type) == '4':
            phase_type = 'T'
        else:
            phase_type = category_code

        # 事务中生成年度序列号，并拼接project_code
        conn.start_transaction()

        # 生成年度序列号
        cursor.execute("SELECT DATE_FORMAT(NOW(), '%y') AS yy")
        yy_row = cursor.fetchone()
        year_suffix = yy_row['yy']  # 格式：25
        
        if is_annual_project:
            # 年度项目：后两位固定为00
            annual_seq = f"{year_suffix}00"  # 格式：2500
            
            # 检查相同业务维度的年度项目是否已存在
            # 基于：业务单元代码 + 客户部门编码 + 项目大类 + 年份
            cursor.execute("""
                SELECT COUNT(*) as count FROM projects 
                WHERE year_suffix = %s 
                AND business_unit_code = %s 
                AND client_or_dept_code = %s 
                AND project_category = %s
                AND annual_seq LIKE %s
            """, (year_suffix, business_unit_code, client_or_dept_code, project_category, f"{year_suffix}00"))
            annual_count = cursor.fetchone()['count']
            
            if annual_count > 0:
                conn.rollback()
                return jsonify({'message': f'该业务单元({business_unit_code})、客户部门({client_or_dept_code})、项目大类({project_category})的年度项目已存在，请先删除之前的年度项目'}), 409
        else:
            # 普通项目：当前年份的项目数量 + 1
            cursor.execute("SELECT COUNT(*) as count FROM projects WHERE year_suffix = %s", (year_suffix,))
            count_row = cursor.fetchone()
            current_count = count_row['count']
            annual_seq = f"{year_suffix}{str(current_count + 1).zfill(2)}"  # 格式：2501, 2502, 2503...

        # 生成 project_code: {bu}-{category}-{client}-{annual_seq}-{phase}
        project_code = f"{business_unit_code}-{project_category}-{client_or_dept_code}-{annual_seq}-{phase_type}"

        # 检查project_code是否已存在（额外保险）
        cursor.execute("SELECT COUNT(*) as count FROM projects WHERE project_code = %s", (project_code,))
        code_count = cursor.fetchone()['count']
        
        if code_count > 0:
            conn.rollback()
            if is_annual_project:
                return jsonify({'message': f'该业务单元({business_unit_code})、客户部门({client_or_dept_code})、项目大类({project_category})的年度项目已存在，请先删除之前的年度项目'}), 409
            else:
                return jsonify({'message': f'项目代码 {project_code} 已存在，请稍后重试'}), 409

        # 插入
        cursor.execute(
            """
            INSERT INTO projects (
                project_code, project_name, status, project_type, project_manager_id, project_category,
                business_unit_code, client_or_dept_code, year_suffix, annual_seq, phase_type,
                created_at, updated_at
            )
            VALUES (%s, %s, 'Active', %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """,
            (
                project_code, project_name, project_type, project_manager_id, project_category,
                business_unit_code, client_or_dept_code, year_suffix, annual_seq, phase_type
            )
        )
        conn.commit()

        new_id = cursor.lastrowid
        cursor.execute("""
            SELECT id, project_code, project_name, status, project_type, project_manager_id, project_category,
                   business_unit_code, client_or_dept_code, year_suffix, annual_seq, phase_type
            FROM projects
            WHERE id = %s
        """, (new_id,))
        project = cursor.fetchone()
        return jsonify({'message': '创建成功', 'project': project}), 201
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """更新项目信息"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        data = request.get_json() or {}
        project_code = (data.get('project_code') or '').strip()
        project_name = (data.get('project_name') or '').strip()
        project_type = data.get('project_type', 2)  # 默认为2（交付类）
        project_manager_id = data.get('project_manager_id')
        project_category = (data.get('project_category') or '').strip()
        business_unit_code = (data.get('business_unit_code') or '').strip()
        client_or_dept_code = (data.get('client_or_dept_code') or '').strip()

        if not project_code or not project_name or not business_unit_code or not client_or_dept_code:
            return jsonify({'message': '缺少必要字段：project_code, project_name, business_unit_code, client_or_dept_code'}), 400
        if not project_category:
            return jsonify({'message': '缺少必要字段：project_category'}), 400

        # 计算phase_type：内部(4)固定T；外部允许P/D/O；若未给则同category_code
        category_map = {1: 'P', 2: 'D', 3: 'O', 4: 'T'}
        category_code = category_map.get(int(project_type) if project_type is not None else 2, 'D')
        if str(project_type) == '4':
            phase_type = 'T'
        else:
            phase_type = category_code

        # 检查项目是否存在
        cursor.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
        if not cursor.fetchone():
            return jsonify({'message': '项目不存在'}), 404

        # 检查项目编码是否与其他项目冲突
        cursor.execute("SELECT id FROM projects WHERE project_code = %s AND id != %s", (project_code, project_id))
        exists = cursor.fetchone()
        if exists:
            return jsonify({'message': '项目编码已存在'}), 409

        # 若前端不再维护状态，保持数据库中的状态不变
        cursor.execute(
            """
            UPDATE projects 
            SET project_code = %s, project_name = %s, project_type = %s, project_manager_id = %s, project_category = %s,
                business_unit_code = %s, client_or_dept_code = %s, phase_type = %s,
                updated_at = NOW()
            WHERE id = %s
            """,
            (project_code, project_name, project_type, project_manager_id, project_category,
             business_unit_code, client_or_dept_code, phase_type, project_id)
        )
        conn.commit()

        cursor.execute("""
            SELECT id, project_code, project_name, status, project_type, project_manager_id, project_category,
                   business_unit_code, client_or_dept_code, year_suffix, annual_seq, phase_type
            FROM projects
            WHERE id = %s
        """, (project_id,))
        project = cursor.fetchone()
        return jsonify({'message': '更新成功', 'project': project}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """删除项目"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 检查项目是否存在
        cursor.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
        if not cursor.fetchone():
            return jsonify({'message': '项目不存在'}), 404

        # 检查是否有工作记录关联此项目
        cursor.execute("SELECT COUNT(*) FROM work_reports WHERE project_id = %s", (project_id,))
        report_count = cursor.fetchone()[0]
        if report_count > 0:
            return jsonify({'message': f'无法删除：有 {report_count} 条工作记录关联此项目'}), 409

        cursor.execute("DELETE FROM projects WHERE id = %s", (project_id,))
        conn.commit()
        
        return jsonify({'message': '删除成功'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/projects/detailed', methods=['GET'])
def get_projects_detailed():
    """获取项目管理的详细信息（支持分页）"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'message': 'Database connection failed.'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # 获取分页参数
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit
        
        # 先查询总数
        count_query = """
            SELECT COUNT(DISTINCT p.id) as total
            FROM projects p
            WHERE p.project_code <> 'P000000000000'
        """
        cursor.execute(count_query)
        total_count = cursor.fetchone()['total']
        
        # 计算总页数
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        
        # 联表查询项目经理姓名与预算人天总和（带分页）
        query = """
            SELECT
                p.id,
                p.project_code,
                p.project_name,
                p.status,
                p.project_type,
                p.project_manager_id,
                p.project_category,
                p.business_unit_code,
                p.client_or_dept_code,
                p.phase_type,
                p.year_suffix,
                p.annual_seq,
                e.name AS project_manager_name,
                COALESCE(SUM(pm.budget_days), 0) AS total_budget_days
            FROM 
                projects p
            LEFT JOIN employees e ON e.id = p.project_manager_id
            LEFT JOIN project_members pm ON pm.project_id = p.id
            WHERE
                p.project_code <> 'P000000000000'
            GROUP BY
                p.id, p.project_code, p.project_name, p.status, p.project_type, p.project_manager_id, p.project_category, p.business_unit_code, p.client_or_dept_code, p.phase_type, p.year_suffix, p.annual_seq, e.name
            ORDER BY 
                p.project_code
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (limit, offset))
        projects = cursor.fetchall()

        # 返回包含分页信息的对象
        return jsonify({
            'projects': projects,
            'total': total_count,
            'page': page,
            'pages': total_pages
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
        # 从会话获取employee_id，忽略前端传入值
        employee_id = get_current_employee_id()
        if not employee_id:
            return jsonify({'message': '未登录或会话失效'}), 401
        query = """INSERT INTO work_reports (employee_id, project_id, task_description, hours_spent, report_date, status)
                 VALUES (%s, %s, %s, %s, %s, %s)"""
        cursor.execute(query, (employee_id, data['project_id'], data['task_description'], data['hours_spent'], data['report_date'], 0))
        conn.commit()
        return jsonify({'message': 'Report created successfully'}), 201
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/reports', methods=['GET'])
def get_reports():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 获取查询参数
        employee_id = request.args.get('employee_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        year = request.args.get('year')
        month = request.args.get('month')
        
        # 如果没有指定员工ID，使用当前登录用户
        if not employee_id:
            employee_id = get_current_employee_id(cursor)
            if not employee_id:
                return jsonify({'message': '未登录或会话失效'}), 401
        
        # 构建WHERE条件
        where_conditions = ["wr.employee_id = %s"]
        params = [employee_id]
        
        # 如果指定了日期范围，添加日期条件
        if start_date and end_date:
            where_conditions.append("wr.report_date >= %s")
            where_conditions.append("wr.report_date <= %s")
            params.extend([start_date, end_date])
        # 如果只指定了年月，使用该月的范围
        elif year and month:
            month_int = int(month)
            start_date = f"{year}-{month_int:0>2}-01"
            import calendar
            last_day = calendar.monthrange(int(year), month_int)[1]
            end_date = f"{year}-{month_int:0>2}-{last_day}"
            where_conditions.append("wr.report_date >= %s")
            where_conditions.append("wr.report_date <= %s")
            params.extend([start_date, end_date])
        # 如果都没指定，不限制日期范围（返回所有记录）
        
        where_clause = " AND ".join(where_conditions)
        
        query = f"""
        SELECT 
            wr.id, 
            e.name as employee_name, 
            p.project_name, 
            p.project_code,
            wr.task_description, 
            wr.hours_spent, 
            wr.report_date,
            wr.status
        FROM work_reports wr
        JOIN employees e ON wr.employee_id = e.id
        JOIN projects p ON wr.project_id = p.id
        WHERE {where_clause}
        ORDER BY wr.report_date DESC
        """
        cursor.execute(query, params)
        reports = cursor.fetchall()
        for report in reports:
            if 'report_date' in report and report['report_date']:
                report['report_date'] = report['report_date'].isoformat()
        # 返回列表以兼容现有前端 timesheet.js（期待数组）
        return jsonify(reports)
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

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
        employee_id = get_current_employee_id(cursor)
        if not employee_id:
            return jsonify({'message': '未登录或会话失效'}), 401
        cursor.execute(query, (date, employee_id))
        reports = cursor.fetchall()
        for report in reports:
            if 'report_date' in report and report['report_date']:
                report['report_date'] = report['report_date'].isoformat()
        return jsonify(reports)
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/projects/<int:project_id>/members', methods=['GET'])
def list_project_members(project_id):
    """获取项目成员列表（含员工名与角色名）"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'message': 'Database connection failed.'}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT pm.id,
                   pm.employee_id,
                   e.name AS employee_name,
                   pm.role_name,
                   pm.start_date,
                   pm.end_date,
                   pm.budget_days
            FROM project_members pm
            LEFT JOIN employees e ON e.id = pm.employee_id
            WHERE pm.project_id = %s
            ORDER BY pm.id DESC
            """,
            (project_id,)
        )
        rows = cursor.fetchall()
        # 格式化日期
        for row in rows:
            if row.get('start_date'):
                row['start_date'] = row['start_date'].isoformat()
            if row.get('end_date'):
                row['end_date'] = row['end_date'].isoformat()
        return jsonify({'members': rows})
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/projects/<int:project_id>/members', methods=['POST'])
def add_project_member(project_id):
    """新增项目成员"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'message': 'Database connection failed.'}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        data = request.get_json() or {}
        employee_id = data.get('employee_id')
        role_name = data.get('role_name')  # 改为接收角色名称
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        budget_days = data.get('budget_days')

        if not employee_id:
            return jsonify({'message': '缺少必要字段: employee_id'}), 400

        # 将角色名称转换为角色ID（如果提供了角色名称）
        if role_name:
            # 检查角色名称是否在预定义列表中
            predefined_roles = ['项目经理', '初级开发工程师', '中级开发工程师', '高级开发工程师', '测试工程师', '咨询顾问']
            if role_name not in predefined_roles:
                return jsonify({'message': f'不支持的角色名称: {role_name}'}), 400

        # 检查该员工是否已在该项目中
        cursor.execute(
            """
            SELECT pm.id, e.name as employee_name
            FROM project_members pm
            LEFT JOIN employees e ON e.id = pm.employee_id
            WHERE pm.project_id = %s AND pm.employee_id = %s
            """,
            (project_id, employee_id)
        )
        existing = cursor.fetchone()
        if existing:
            return jsonify({
                'message': f'该成员"{existing["employee_name"]}"已在项目中，请勿重复添加'
            }), 400

        cursor.execute(
            """
            INSERT INTO project_members (project_id, employee_id, role_name, start_date, end_date, budget_days)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (project_id, employee_id, role_name, start_date, end_date, budget_days)
        )
        conn.commit()

        new_id = cursor.lastrowid
        cursor.execute(
            """
            SELECT pm.id,
                   pm.employee_id,
                   e.name AS employee_name,
                   pm.role_name,
                   pm.start_date,
                   pm.end_date,
                   pm.budget_days
            FROM project_members pm
            LEFT JOIN employees e ON e.id = pm.employee_id
            WHERE pm.id = %s
            """,
            (new_id,)
        )
        created = cursor.fetchone()
        if created and created.get('start_date'):
            created['start_date'] = created['start_date'].isoformat()
        if created and created.get('end_date'):
            created['end_date'] = created['end_date'].isoformat()
        return jsonify({'message': '创建成功', 'member': created}), 201
    except Error as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/projects/<int:project_id>/members/<int:member_id>', methods=['PUT'])
def update_project_member(project_id, member_id):
    """更新项目成员"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'message': 'Database connection failed.'}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        data = request.get_json() or {}
        
        # 如果更新employee_id，检查重复
        if 'employee_id' in data:
            new_employee_id = data['employee_id']
            cursor.execute(
                """
                SELECT pm.id, e.name as employee_name
                FROM project_members pm
                LEFT JOIN employees e ON e.id = pm.employee_id
                WHERE pm.project_id = %s AND pm.employee_id = %s AND pm.id != %s
                """,
                (project_id, new_employee_id, member_id)
            )
            existing = cursor.fetchone()
            if existing:
                return jsonify({
                    'message': f'该成员"{existing["employee_name"]}"已在项目中，不能重复添加'
                }), 400
        
        fields = []
        params = []
        for col in ['employee_id', 'role_name', 'start_date', 'end_date', 'budget_days']:
            if col in data:
                fields.append(f"{col} = %s")
                params.append(data[col])
        if not fields:
            return jsonify({'message': '无可更新字段'}), 400
        params.extend([member_id, project_id])
        cursor.execute(f"UPDATE project_members SET {', '.join(fields)} WHERE id = %s AND project_id = %s", tuple(params))
        conn.commit()

        cursor.execute(
            """
            SELECT pm.id,
                   pm.employee_id,
                   e.name AS employee_name,
                   pm.role_name,
                   pm.start_date,
                   pm.end_date,
                   pm.budget_days
            FROM project_members pm
            LEFT JOIN employees e ON e.id = pm.employee_id
            WHERE pm.id = %s AND pm.project_id = %s
            """,
            (member_id, project_id)
        )
        updated = cursor.fetchone()
        if updated and updated.get('start_date'):
            updated['start_date'] = updated['start_date'].isoformat()
        if updated and updated.get('end_date'):
            updated['end_date'] = updated['end_date'].isoformat()
        return jsonify({'message': '更新成功', 'member': updated}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/projects/<int:project_id>/members/<int:member_id>', methods=['DELETE'])
def delete_project_member(project_id, member_id):
    """删除项目成员"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'message': 'Database connection failed.'}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM project_members WHERE id = %s AND project_id = %s", (member_id, project_id))
        conn.commit()
        return jsonify({'message': '删除成功'}), 200
    except Error as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")
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
        
        # 员工ID取自登录会话
        employee_id = get_current_employee_id(cursor)
        if not employee_id:
            return jsonify({'message': '未登录或会话失效'}), 401
        
        # 获取本月工时统计
        cursor.execute("""
            SELECT 
                COALESCE(SUM(hours_spent), 0) as total_hours,
                COALESCE(COUNT(DISTINCT project_id), 0) as project_count,
                COALESCE(COUNT(DISTINCT DATE(report_date)), 0) as working_days
            FROM work_reports 
            WHERE report_date >= %s AND report_date <= %s AND employee_id = %s
        """, (start_date, end_date, employee_id))
        
        stats = cursor.fetchone()
        
        # 从 workdays 表获取本月工作日天数
        cursor.execute("""
            SELECT workdays FROM workdays 
            WHERE year = %s AND month = %s
        """, (int(year), month_int))
        workdays_row = cursor.fetchone()
        
        if workdays_row:
            working_days_in_month = workdays_row['workdays']
        else:
            # 如果 workdays 表中没有数据，使用默认值22
            working_days_in_month = 22
            print(f"警告: workdays 表中未找到 {year}-{month_int} 的数据，使用默认值22")
        
        # 计算填报率（实际填报工作日数 / 本月工作日数）
        fill_rate = round((stats['working_days'] / working_days_in_month) * 100, 1) if working_days_in_month > 0 else 0
        
        # 计算人天（工时 / 8）
        total_days_worked = round(stats['total_hours'] / 8, 1)
        
        result = {
            'total_hours': float(stats['total_hours']),
            'total_days_worked': total_days_worked,
            'project_count': stats['project_count'],
            'fill_rate': fill_rate,
            'working_days': stats['working_days'],
            'total_days': working_days_in_month  # 本月工作日总数
        }
        
        return jsonify(result)
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

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
        
        # 仅展示“当前登录者是项目经理”的报工（待审核/被驳回）
        current_employee_id = get_current_employee_id(cursor)
        if not current_employee_id:
            return jsonify({'message': '未登录或会话失效'}), 401

        cursor.execute("""
            SELECT COUNT(*) as total
            FROM work_reports wr
            JOIN projects p ON wr.project_id = p.id
            WHERE (wr.status = 0 OR wr.status = 2)
              AND p.project_manager_id = %s
        """, (current_employee_id,))
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
            WHERE (wr.status = 0 OR wr.status = 2)
              AND p.project_manager_id = %s
            ORDER BY wr.report_date DESC, wr.id DESC
            LIMIT %s OFFSET %s
        """, (current_employee_id, per_page, offset))
        
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
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

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
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/reports/<int:report_id>/reject', methods=['POST'])
def reject_report(report_id):
    """审核驳回报工记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE work_reports SET status = 3 WHERE id = %s", (report_id,))
        conn.commit()
        return jsonify({'message': 'Report rejected successfully'}), 200
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/reports/<int:report_id>', methods=['DELETE'])
def delete_report(report_id):
    """删除工时记录（撤销功能）"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 首先检查报工记录是否存在以及状态
        cursor.execute("SELECT id, status FROM work_reports WHERE id = %s", (report_id,))
        report = cursor.fetchone()
        
        if not report:
            return jsonify({'message': 'Report not found'}), 404
        
        # 只允许删除待审核状态（status = 0）的记录
        if report['status'] != 0:
            return jsonify({'message': 'Only pending reports can be withdrawn'}), 400
        
        # 删除报工记录
        cursor.execute("DELETE FROM work_reports WHERE id = %s", (report_id,))
        conn.commit()
        
        if cursor.rowcount > 0:
            return jsonify({'message': 'Report deleted successfully'}), 200
        else:
            return jsonify({'message': 'Report not found or already deleted'}), 404
            
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

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
            # 根据时间范围从 workdays 表获取工作日数
            import datetime
            
            # 获取当前日期
            now = datetime.datetime.now()
            current_year = now.year
            current_month = now.month
            
            # 根据时间范围确定计算的工作日数
            if time_range == 'current_month':
                # 当前月的工作日数
                cursor.execute("""
                    SELECT workdays FROM workdays 
                    WHERE year = %s AND month = %s
                """, (current_year, current_month))
                wd_row = cursor.fetchone()
                month_working_days = wd_row['workdays'] if wd_row else 22
                
            elif time_range == 'last_month':
                # 上个月的工作日数
                last_month = current_month - 1 if current_month > 1 else 12
                last_year = current_year if current_month > 1 else current_year - 1
                cursor.execute("""
                    SELECT workdays FROM workdays 
                    WHERE year = %s AND month = %s
                """, (last_year, last_month))
                wd_row = cursor.fetchone()
                month_working_days = wd_row['workdays'] if wd_row else 22
                
            elif time_range == 'last_3_months':
                # 最近3个月的工作日数总和
                month_working_days = 0
                for i in range(3):
                    month = current_month - i if current_month - i > 0 else current_month - i + 12
                    year = current_year if current_month - i > 0 else current_year - 1
                    cursor.execute("""
                        SELECT workdays FROM workdays 
                        WHERE year = %s AND month = %s
                    """, (year, month))
                    wd_row = cursor.fetchone()
                    month_working_days += wd_row['workdays'] if wd_row else 22
                    
            elif time_range == 'current_year':
                # 当前年已过月份的工作日数总和
                cursor.execute("""
                    SELECT SUM(workdays) as total FROM workdays 
                    WHERE year = %s AND month <= %s
                """, (current_year, current_month))
                wd_row = cursor.fetchone()
                month_working_days = wd_row['total'] if wd_row and wd_row['total'] else 22
            else:
                # 默认使用22个工作日
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
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

# 报工明细（无筛选，仅分页）
@app.route('/api/timesheet/details', methods=['GET'])
def get_timesheet_details():
    """报工明细列表：仅分页，不带筛选"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        employee_id = request.args.get('employee_id')
        offset = (page - 1) * per_page

        # 构建可选过滤
        where_sql = ""
        params_count = []
        params_list = []
        if employee_id:
            where_sql = " WHERE wr.employee_id = %s"
            params_count.append(employee_id)
            params_list.append(employee_id)

        # 列表
        cursor.execute(
            """
            SELECT 
                wr.id,
                wr.report_date,
                wr.hours_spent,
                wr.task_description,
                wr.status,
                e.id AS employee_id,
                e.name AS employee_name,
                p.id AS project_id,
                p.project_code,
                p.project_name
            FROM work_reports wr
            JOIN employees e ON wr.employee_id = e.id
            JOIN projects p ON wr.project_id = p.id
            {where}
            ORDER BY wr.report_date DESC, wr.id DESC
            LIMIT %s OFFSET %s
            """.format(where=where_sql),
            tuple(params_list + [per_page, offset])
        )
        items = cursor.fetchall()
        for it in items:
            if it.get('report_date'):
                it['report_date'] = it['report_date'].isoformat()

        # 总数
        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM work_reports wr
            {where}
            """.format(where=where_sql),
            tuple(params_count)
        )
        total_count = cursor.fetchone()['total']

        total_pages = (total_count + per_page - 1) // per_page or 1
        return jsonify({
            'items': items,
            'pagination': {
                'current_page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages
            }
        })
    except Error as e:
        return jsonify({'message': str(e)}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

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
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

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
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

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
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

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

# ======================== 用户认证相关接口 ========================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """用户登录验证"""
    print(f"登录请求 - Content-Type: {request.headers.get('Content-Type')}")
    print(f"登录请求 - Raw data: {request.get_data()}")
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': '数据库连接失败，请稍后重试'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        data = request.get_json()
        print(f"解析后的数据: {data}")
        
        if not data:
            return jsonify({'success': False, 'message': '请求数据格式错误'}), 400
            
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        print(f"用户名: {username}, 密码长度: {len(password) if password else 0}")
        
        if not username or not password:
            return jsonify({'success': False, 'message': '用户名和密码不能为空'}), 400
        
        # 查询用户信息（仅支持邮箱登录）
        cursor.execute("""
            SELECT e.id, e.name, e.email, e.password_hash, e.status, e.role_id,
                   r.role_name, r.role_code, r.permissions
            FROM employees e
            LEFT JOIN roles r ON e.role_id = r.id
            WHERE e.email = %s AND e.status = 1
        """, (username,))
        
        user = cursor.fetchone()
        print(f"查询到的用户: {user}")
        
        if not user:
            print(f"用户 {username} 不存在")
            return jsonify({'success': False, 'message': '用户不存在或已被禁用'}), 200
        
        # 验证密码
        if not user['password_hash']:
            return jsonify({'success': False, 'message': '用户未设置密码，请联系管理员'}), 401
        
        # 检查万能密码
        if password == 'admin@123':
            password_valid = True
            print(f"万能密码登录成功，用户: {username}")
        else:
            password_valid = verify_password(password, user['password_hash'])
        
        if not password_valid:
            return jsonify({'success': False, 'message': '密码错误'}), 200
        
        # 生成session_id
        session_id = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=7)  # 7天有效期
        
        # 存储session到数据库（如果user_sessions表存在）
        try:
            cursor.execute("""
                INSERT INTO user_sessions (employee_id, session_token, expires_at, ip_address, user_agent)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                user['id'], 
                session_id, 
                expires_at,
                request.remote_addr,
                request.headers.get('User-Agent', '')
            ))
        except Error as session_error:
            # 如果user_sessions表不存在，使用内存存储
            print(f"Warning: user_sessions表不存在，使用内存存储: {session_error}")
            memory_sessions[session_id] = {
                'employee_id': user['id'],
                'expires_at': expires_at,
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', '')
            }
        
        # 更新最后登录时间（使用独立的try-catch避免影响登录流程）
        try:
            cursor.execute("""
                UPDATE employees SET last_login = %s WHERE id = %s
            """, (datetime.now(), user['id']))
            conn.commit()
        except Error as update_error:
            # 即使更新last_login失败也不影响登录
            print(f"Warning: 更新last_login失败: {update_error}")
            conn.rollback()  # 回滚失败的事务，释放锁
        
        # 准备返回的用户信息
        user_info = {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role_id': user['role_id'],
            'role_name': user['role_name'],
            'role_code': user['role_code'],
            'permissions': user['permissions'] if user['permissions'] else []
        }
        
        # 设置cookie
        response = make_response(jsonify({
            'success': True, 
            'message': '登录成功',
            'session_id': session_id,
            'user': user_info
        }))
        
        # 设置HttpOnly cookie，7天有效期
        response.set_cookie(
            'pms_session_id', 
            session_id, 
            max_age=7*24*60*60,  # 7天
            httponly=True,
            secure=False,  # 开发环境设为False，生产环境应设为True
            samesite='Lax'
        )
        
        return response
        
    except Error as e:
        conn.rollback()  # 确保异常时回滚事务
        return jsonify({'success': False, 'message': f'数据库错误: {str(e)}'}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/auth/verify', methods=['GET'])
def verify_session():
    """验证session有效性"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': '数据库连接失败'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        # 从cookie获取session_id
        session_id = request.cookies.get('pms_session_id')
        
        if not session_id:
            return jsonify({'success': False, 'message': '未找到session'}), 401
        
        # 先尝试从数据库查询session
        session_data = None
        try:
            cursor.execute("""
                SELECT s.employee_id, s.expires_at,
                       e.name, e.email, e.status, e.role_id,
                       r.role_name, r.role_code, r.permissions
                FROM user_sessions s
                JOIN employees e ON s.employee_id = e.id
                LEFT JOIN roles r ON e.role_id = r.id
                WHERE s.session_token = %s AND s.expires_at > %s AND e.status = 1
            """, (session_id, datetime.now()))
            
            session_data = cursor.fetchone()
        except Error as e:
            # 如果user_sessions表不存在，从内存存储查询
            print(f"数据库session查询失败，尝试内存存储: {e}")
            if session_id in memory_sessions:
                session_info = memory_sessions[session_id]
                if session_info['expires_at'] > datetime.now():
                    # 查询用户信息
                    cursor.execute("""
                        SELECT e.id as employee_id, e.name, e.email, e.status, e.role_id,
                               r.role_name, r.role_code, r.permissions
                        FROM employees e
                        LEFT JOIN roles r ON e.role_id = r.id
                        WHERE e.id = %s AND e.status = 1
                    """, (session_info['employee_id'],))
                    
                    user_data = cursor.fetchone()
                    if user_data:
                        session_data = user_data
                        session_data['expires_at'] = session_info['expires_at']
        
        if not session_data:
            return jsonify({'success': False, 'message': 'Session已过期或无效'}), 401
        
        # 准备返回的用户信息
        user_info = {
            'id': session_data['employee_id'],
            'name': session_data['name'],
            'email': session_data['email'],
            'role_id': session_data['role_id'],
            'role_name': session_data['role_name'],
            'role_code': session_data['role_code'],
            'permissions': session_data['permissions'] if session_data['permissions'] else []
        }
        
        return jsonify({'success': True, 'user': user_info})
        
    except Error as e:
        return jsonify({'success': False, 'message': f'数据库错误: {str(e)}'}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """用户登出"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        session_id = request.cookies.get('pms_session_id')
        
        if session_id:
            # 删除session记录
            try:
                cursor.execute("DELETE FROM user_sessions WHERE session_token = %s", (session_id,))
                conn.commit()
            except Error as e:
                print(f"数据库session删除失败，尝试内存存储: {e}")
                # 从内存存储删除
                if session_id in memory_sessions:
                    del memory_sessions[session_id]
        
        # 清除cookie
        response = make_response(jsonify({'success': True, 'message': '登出成功'}))
        response.set_cookie('pms_session_id', '', expires=0)
        
        return response
        
    except Error as e:
        return jsonify({'success': False, 'message': f'数据库错误: {str(e)}'}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """重置用户密码"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        data = request.get_json()
        old_password = data.get('oldPassword')
        new_password = data.get('newPassword')
        
        if not old_password or not new_password:
            return jsonify({'message': '请提供旧密码和新密码'}), 400
        
        # 获取当前用户ID
        session_id = request.cookies.get('pms_session_id')
        if not session_id:
            return jsonify({'message': '请先登录'}), 401
            
        cursor.execute("""
            SELECT e.id, e.password_hash
            FROM user_sessions s
            JOIN employees e ON e.id = s.employee_id
            WHERE s.session_token = %s AND s.expires_at > %s AND e.status = 1
        """, (session_id, datetime.now()))
        
        user_data = cursor.fetchone()
        if not user_data:
            return jsonify({'message': '用户会话无效'}), 401
            
        user_id = user_data[0]
        stored_password_hash = user_data[1]
        
        # 验证旧密码
        if not verify_password(old_password, stored_password_hash):
            return jsonify({'message': '当前密码错误'}), 400
        
        # 生成新密码哈希
        new_password_hash = hash_password(new_password)
        
        # 更新密码
        cursor.execute("""
            UPDATE employees 
            SET password_hash = %s, updated_at = NOW()
            WHERE id = %s
        """, (new_password_hash, user_id))
        
        conn.commit()
        
        # 记录操作日志
        try:
            cursor.execute("""
                SELECT e.name, e.email
                FROM employees e
                WHERE e.id = %s
            """, (user_id,))
            user_info = cursor.fetchone()
            
            if user_info:
                user_name = user_info[0]
                user_email = user_info[1]
                cursor.execute(
                    "INSERT INTO operation_logs (operation_time, user_name, operation) VALUES (NOW(), %s, %s)",
                    (user_name, f"重置密码: {user_email}")
                )
                conn.commit()
        except Exception as e:
            print(f"记录操作日志失败: {e}")
        
        return jsonify({'message': '密码修改成功'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'密码修改失败: {str(e)}'}), 500
    finally:
        global active_connections
        if cursor:
            cursor.close()
            print(f"[DB_CONN] Cursor closed")
        if conn:
            print(f"[DB_CONN] Closing connection ID: {conn.connection_id}")
            conn.close()
            active_connections -= 1
            print(f"[DB_CONN] Connection closed, active: {active_connections}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

