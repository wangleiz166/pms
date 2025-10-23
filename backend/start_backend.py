#!/usr/bin/env python3
"""
后端服务启动脚本
包含健康检查和错误诊断
"""

import sys
import os

# 确保当前目录在Python路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("PMS后端服务启动检查")
print("=" * 60)

# 1. 检查Python版本
print(f"\n1. Python版本: {sys.version}")
if sys.version_info < (3, 6):
    print("   ❌ 错误: 需要Python 3.6或更高版本")
    sys.exit(1)
print("   ✓ Python版本符合要求")

# 2. 检查依赖包
print("\n2. 检查依赖包:")
required_packages = {
    'flask': 'Flask',
    'flask_cors': 'Flask-CORS',
    'mysql.connector': 'mysql-connector-python'
}

missing_packages = []
for module_name, package_name in required_packages.items():
    try:
        __import__(module_name)
        print(f"   ✓ {package_name} 已安装")
    except ImportError:
        print(f"   ❌ {package_name} 未安装")
        missing_packages.append(package_name)

if missing_packages:
    print(f"\n   错误: 缺少依赖包，请运行:")
    print(f"   pip install {' '.join(missing_packages)}")
    sys.exit(1)

# 3. 检查配置文件
print("\n3. 检查配置文件:")
try:
    from config import DB_CONFIG
    print("   ✓ config.py 存在")
    print(f"   数据库主机: {DB_CONFIG.get('host')}")
    print(f"   数据库名: {DB_CONFIG.get('database')}")
    print(f"   数据库用户: {DB_CONFIG.get('user')}")
except ImportError:
    print("   ❌ config.py 不存在，请创建配置文件")
    print("\n   示例 config.py 内容:")
    print("""
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',
    'database': 'pms'
}
    """)
    sys.exit(1)
except Exception as e:
    print(f"   ❌ 配置文件错误: {e}")
    sys.exit(1)

# 4. 检查数据库连接
print("\n4. 检查数据库连接:")
try:
    import mysql.connector
    from config import DB_CONFIG
    
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("SELECT VERSION()")
    version = cursor.fetchone()
    print(f"   ✓ 数据库连接成功")
    print(f"   MySQL版本: {version[0]}")
    
    # 检查关键表是否存在
    cursor.execute("SHOW TABLES")
    tables = [table[0] for table in cursor.fetchall()]
    
    required_tables = ['employees', 'projects', 'work_reports', 'user_sessions']
    missing_tables = [t for t in required_tables if t not in tables]
    
    if missing_tables:
        print(f"   ⚠ 警告: 缺少表: {', '.join(missing_tables)}")
    else:
        print(f"   ✓ 所有必需的表都存在")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as e:
    print(f"   ❌ 数据库连接失败: {e}")
    print(f"\n   请检查:")
    print(f"   1. MySQL服务是否运行")
    print(f"   2. config.py中的数据库配置是否正确")
    print(f"   3. 数据库用户是否有权限访问")
    sys.exit(1)
except Exception as e:
    print(f"   ❌ 未知错误: {e}")
    sys.exit(1)

# 5. 检查端口占用
print("\n5. 检查端口5001:")
import socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
result = sock.connect_ex(('127.0.0.1', 5001))
sock.close()

if result == 0:
    print("   ⚠ 警告: 端口5001已被占用")
    print("   如果后端已在运行，请先停止")
else:
    print("   ✓ 端口5001可用")

# 6. 启动Flask应用
print("\n" + "=" * 60)
print("所有检查通过，启动Flask应用...")
print("=" * 60)
print()

try:
    from app import app
    
    # 启动应用
    print("后端服务启动在: http://0.0.0.0:5001")
    print("本地访问: http://127.0.0.1:5001")
    print("局域网访问: http://10.10.201.67:5001")
    print("\n按 Ctrl+C 停止服务\n")
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        use_reloader=False  # 避免重复启动检查
    )
    
except KeyboardInterrupt:
    print("\n\n服务已停止")
except Exception as e:
    print(f"\n❌ 启动失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

