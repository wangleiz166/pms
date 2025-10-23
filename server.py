import http.server
import socketserver
import os
import sys

# 定义前端服务端口
PORT = 5002

# 定义要服务的目录（项目根目录）
web_dir = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Python 3.7+ 支持 directory 参数，Python 3.6 需要手动切换目录
        if sys.version_info >= (3, 7):
            super().__init__(*args, directory=web_dir, **kwargs)
        else:
            # Python 3.6 兼容方案 - 确保目录存在
            if web_dir and os.path.exists(web_dir):
                os.chdir(web_dir)
            super().__init__(*args, **kwargs)

print("=========================================================")
print("  Frontend server starting...")
print("  Serving on: http://127.0.0.1:{}".format(PORT))
print("  Serving files from: {}".format(web_dir))
print("  Directory exists: {}".format(os.path.exists(web_dir)))
print("=========================================================")

# 启动服务器
try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("Server started successfully on port {}".format(PORT))
        httpd.serve_forever()
except OSError as e:
    if e.errno == 98:  # Address already in use
        print("Error: Port {} is already in use.".format(PORT))
        print("Please stop the existing server or use a different port.")
        print("You can find and kill the process using:")
        print("  lsof -i :{}".format(PORT))
        print("  kill -9 <PID>")
    else:
        print("Error starting server: {}".format(e))
except KeyboardInterrupt:
    print("\nServer stopped by user")
except Exception as e:
    print("Unexpected error: {}".format(e))
