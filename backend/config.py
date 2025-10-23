# MySQL Configurations - 阿里云RDS
DB_CONFIG = {
    'host': 'rm-bp18n946zcfchmmjco.mysql.rds.aliyuncs.com',  # 阿里云RDS主机
    'port': 3306,
    'user': 'pms',              # 数据库用户名
    'password': 'Pintechs@123', # 数据库密码
    'database': 'pms',          # 数据库名称
    'charset': 'utf8mb4',
    'autocommit': False,        # 手动控制事务
    'connect_timeout': 30,      # 连接超时30秒
    'connection_timeout': 30,   # 连接超时30秒
    'raise_on_warnings': False, # 忽略警告
    'use_unicode': True,        # 使用Unicode
    'sql_mode': 'TRADITIONAL',  # SQL模式
    'auth_plugin': 'mysql_native_password'  # 认证插件
}
