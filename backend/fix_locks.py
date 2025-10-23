#!/usr/bin/env python3
"""
数据库锁修复工具
自动检测并解决数据库锁等待超时问题
"""

import sys
import mysql.connector
from config import DB_CONFIG

def fix_database_locks():
    """检测并修复数据库锁"""
    
    print("=" * 60)
    print("数据库锁修复工具")
    print("=" * 60)
    
    try:
        # 连接数据库
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        print("\n✓ 数据库连接成功\n")
        
        # 1. 查看当前运行的进程
        print("1. 正在检查数据库进程...")
        print("-" * 60)
        cursor.execute("""
            SELECT 
                id,
                user,
                host,
                db,
                command,
                time,
                state,
                LEFT(info, 100) as query_preview
            FROM information_schema.PROCESSLIST
            WHERE db = 'pms' OR db IS NULL
            ORDER BY time DESC
        """)
        
        processes = cursor.fetchall()
        if processes:
            print(f"找到 {len(processes)} 个进程:\n")
            for p in processes:
                time_sec = p['time'] or 0
                print(f"  ID: {p['id']:>5} | User: {p['user']:>10} | "
                      f"Command: {p['command']:>10} | Time: {time_sec:>5}s | "
                      f"State: {p['state'] or 'None'}")
        else:
            print("  没有找到进程")
        
        # 2. 查看当前的事务
        print("\n2. 正在检查未提交的事务...")
        print("-" * 60)
        cursor.execute("""
            SELECT 
                trx_id,
                trx_state,
                trx_started,
                trx_mysql_thread_id,
                trx_tables_locked,
                trx_rows_locked,
                LEFT(trx_query, 100) as query_preview
            FROM information_schema.INNODB_TRX
        """)
        
        transactions = cursor.fetchall()
        blocking_threads = []
        
        if transactions:
            print(f"找到 {len(transactions)} 个活跃事务:\n")
            for trx in transactions:
                print(f"  事务ID: {trx['trx_id']}")
                print(f"    状态: {trx['trx_state']}")
                print(f"    开始时间: {trx['trx_started']}")
                print(f"    线程ID: {trx['trx_mysql_thread_id']}")
                print(f"    锁定表数: {trx['trx_tables_locked']}")
                print(f"    锁定行数: {trx['trx_rows_locked']}")
                if trx['query_preview']:
                    print(f"    查询: {trx['query_preview']}")
                print()
                
                blocking_threads.append(trx['trx_mysql_thread_id'])
        else:
            print("  ✓ 没有找到未提交的事务\n")
        
        # 3. 查看锁等待
        print("3. 正在检查锁等待情况...")
        print("-" * 60)
        cursor.execute("""
            SELECT 
                r.trx_id AS waiting_trx_id,
                r.trx_mysql_thread_id AS waiting_thread,
                LEFT(r.trx_query, 100) AS waiting_query,
                b.trx_id AS blocking_trx_id,
                b.trx_mysql_thread_id AS blocking_thread,
                LEFT(b.trx_query, 100) AS blocking_query
            FROM information_schema.INNODB_LOCK_WAITS w
            INNER JOIN information_schema.INNODB_TRX b ON b.trx_id = w.blocking_trx_id
            INNER JOIN information_schema.INNODB_TRX r ON r.trx_id = w.requesting_trx_id
        """)
        
        lock_waits = cursor.fetchall()
        if lock_waits:
            print(f"⚠ 发现 {len(lock_waits)} 个锁等待:\n")
            for lw in lock_waits:
                print(f"  阻塞线程: {lw['blocking_thread']} (事务ID: {lw['blocking_trx_id']})")
                print(f"  阻塞查询: {lw['blocking_query']}")
                print(f"  等待线程: {lw['waiting_thread']} (事务ID: {lw['waiting_trx_id']})")
                print(f"  等待查询: {lw['waiting_query']}")
                print()
                
                if lw['blocking_thread'] not in blocking_threads:
                    blocking_threads.append(lw['blocking_thread'])
        else:
            print("  ✓ 没有发现锁等待\n")
        
        # 4. 查找长时间Sleep的连接
        print("4. 正在检查长时间空闲的连接...")
        print("-" * 60)
        cursor.execute("""
            SELECT 
                id,
                user,
                host,
                db,
                command,
                time
            FROM information_schema.PROCESSLIST
            WHERE command = 'Sleep' 
              AND time > 300
            ORDER BY time DESC
        """)
        
        idle_connections = cursor.fetchall()
        if idle_connections:
            print(f"⚠ 发现 {len(idle_connections)} 个长时间空闲的连接 (>5分钟):\n")
            for conn in idle_connections:
                print(f"  ID: {conn['id']:>5} | User: {conn['user']:>10} | "
                      f"Time: {conn['time']:>5}s | Host: {conn['host']}")
        else:
            print("  ✓ 没有发现长时间空闲的连接\n")
        
        # 5. 提供修复建议
        print("\n" + "=" * 60)
        print("修复建议:")
        print("=" * 60)
        
        if blocking_threads:
            print("\n⚠ 发现阻塞的线程，建议终止以下线程:\n")
            for thread_id in set(blocking_threads):
                print(f"  KILL {thread_id};")
            
            print("\n是否自动终止这些线程? (y/n): ", end='')
            choice = input().strip().lower()
            
            if choice == 'y':
                for thread_id in set(blocking_threads):
                    try:
                        cursor.execute(f"KILL {thread_id}")
                        print(f"  ✓ 已终止线程 {thread_id}")
                    except Exception as e:
                        print(f"  ✗ 终止线程 {thread_id} 失败: {e}")
                conn.commit()
                print("\n✓ 锁已清理")
            else:
                print("\n  请手动执行上述KILL命令")
        
        elif idle_connections:
            print("\n建议清理长时间空闲的连接，但这不是紧急问题")
        
        else:
            print("\n✓ 没有发现明显的锁问题")
            print("\n如果仍然出现锁等待超时，建议:")
            print("  1. 重启MySQL服务: net stop MySQL80 && net start MySQL80")
            print("  2. 检查应用代码是否正确提交/回滚事务")
            print("  3. 增加锁等待超时时间: SET GLOBAL innodb_lock_wait_timeout = 120;")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"\n✗ 数据库错误: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ 未知错误: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    print("\n" + "=" * 60)
    return 0

if __name__ == "__main__":
    sys.exit(fix_database_locks())

