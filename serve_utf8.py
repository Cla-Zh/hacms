#!/usr/bin/env python3
"""
AAM-CMS UTF-8 服务器启动脚本
- 强制 UTF-8 charset 解决中文乱码
- 正确 MIME type（HTML/JS/CSS/JSON/字体等）
"""
import http.server
import os

PORT = 8080

# 已知 MIME types（补充 Python 内置映射）
EXTRA_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.htm':  'text/html; charset=UTF-8',
    '.js':   'application/javascript; charset=UTF-8',
    '.css':  'text/css; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.svg':  'image/svg+xml; charset=UTF-8',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.ico':  'image/x-icon',
    '.pdf':  'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc':  'application/msword',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt':  'application/vnd.ms-powerpoint',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls':  'application/vnd.ms-excel',
    '.md':   'text/markdown; charset=UTF-8',
}

class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='.', **kwargs)

    def guess_type(self, path):
        """Override to add UTF-8 charset for text-based types"""
        ext = os.path.splitext(path)[1].lower()
        if ext in EXTRA_TYPES:
            return EXTRA_TYPES[ext]
        return super().guess_type(path)

    def end_headers(self):
        # 对 HTML 额外强制 charset（双保险）
        if self.path.endswith('.html') or self.path.endswith('.htm'):
            self.send_header('Content-Type', 'text/html; charset=UTF-8')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[AAM-CMS] {args[0]}")

with http.server.TCPServer(("", PORT), UTF8Handler) as httpd:
    print(f"✅ AAM-CMS serving at http://localhost:{PORT}")
    print(f"   charset=UTF-8  (中文正常显示)")
    httpd.serve_forever()