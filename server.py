import http.server
import socketserver
import os

# 定义前端服务端口
PORT = 5002

# 定义要服务的目录（项目根目录）
web_dir = os.path.join(os.path.dirname(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=web_dir, **kwargs)

print(f"=========================================================")
print(f"  Frontend server starting...")
print(f"  Serving on: http://127.0.0.1:{PORT}")
print(f"  Serving files from: {web_dir}")
print(f"=========================================================")

# 启动服务器
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
