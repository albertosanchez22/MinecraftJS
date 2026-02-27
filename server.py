#!/usr/bin/env python3
"""
Servidor HTTP sin caché para desarrollo local.
Uso: python3 server.py
"""
import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Solo log de errores para no llenar la consola
        if args and str(args[1]) not in ('200', '304'):
            super().log_message(format, *args)

with socketserver.TCPServer(('', PORT), NoCacheHandler) as httpd:
    httpd.allow_reuse_address = True
    print(f'✓ Servidor en http://localhost:{PORT}  (sin caché)')
    httpd.serve_forever()
