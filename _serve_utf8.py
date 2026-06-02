import http.server, json, sys, socketserver, os

PORT = 8899
os.chdir('C:/Users/Administrator/.openclaw/workspace/hacms')

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def guess_content_type(self):
        path = self.translate_path(self.path)
        if path.endswith('.json'):
            return 'application/json; charset=utf-8'
        return super().guess_content_type()

    def end_headers(self):
        # Force UTF-8 charset for JSON files
        if self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json; charset=utf-8')
        super().end_headers()

    def log_message(self, format, *args):
        pass  # Suppress logging

httpd = socketserver.TCPServer(('127.0.0.1', PORT), MyHandler)
print('Serving on port', PORT, '- press Ctrl+C to stop')
sys.stdout.flush()
httpd.serve_forever()