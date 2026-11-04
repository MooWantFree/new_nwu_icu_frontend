"""Exercise the built HTML and real Nginx configuration in disposable containers.

Run after pnpm build, using Python and Docker inside WSL/Linux.
"""
import json
import os
import subprocess
import tempfile
import time
import unittest
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class GatewayBootstrapTests(unittest.TestCase):
    def docker(self, *args):
        return subprocess.check_output(['docker', *args], text=True, stderr=subprocess.STDOUT)

    def setUp(self):
        self.prefix = 'nwuicu-bootstrap-' + uuid.uuid4().hex[:12]
        self.network = self.prefix + '-network'
        self.web = self.prefix + '-web'
        self.gateway = self.prefix + '-gateway'
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        directory = Path(self.temp.name)
        self.state = directory / 'state.json'
        self.set_state('ok', 'Campus A')
        (directory / 'server.py').write_text('''
import json, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        state = json.loads(Path('/fixture/state.json').read_text())
        if state['mode'] == 'slow':
            time.sleep(4)
        if state['mode'] == 'error':
            self.send_response(503)
            self.end_headers()
            self.wfile.write(b'UPSTREAM_ERROR_SHOULD_NOT_LEAK')
            return
        config = json.dumps({'site_name': state['name'],
            'has_cookie': bool(self.headers.get('Cookie')),
            'has_authorization': bool(self.headers.get('Authorization'))})
        config = config.replace('<', '\\\\u003C').replace('>', '\\\\u003E').replace('&', '\\\\u0026')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(('<script id="site-config-bootstrap" type="application/json">' + config + '</script>').encode())
    def log_message(self, *args):
        pass
ThreadingHTTPServer(('0.0.0.0', 8000), Handler).serve_forever()
''')
        self.docker('network', 'create', self.network)
        self.addCleanup(self.cleanup_containers)
        self.docker('run', '-d', '--name', self.web, '--network', self.network,
                    '--network-alias', 'web', '-v', f'{directory}:/fixture:ro',
                    'python:3.11-slim', 'python', '/fixture/server.py')
        self.docker('run', '-d', '--name', self.gateway, '--network', self.network,
                    '--network-alias', 'gateway',
                    '-v', f'{ROOT / "dist"}:/usr/share/nginx/html:ro',
                    '-v', f'{ROOT / "nginx/default.conf"}:/etc/nginx/conf.d/default.conf:ro',
                    os.environ.get('GATEWAY_TEST_IMAGE', 'nginx:1.27-alpine'))
        for _ in range(30):
            try:
                if 'site-config-bootstrap' in self.request('/')['body']:
                    break
            except subprocess.CalledProcessError:
                pass
            time.sleep(0.1)
        else:
            self.fail(self.docker('logs', self.gateway))

    def cleanup_containers(self):
        for name in (self.gateway, self.web):
            subprocess.run(['docker', 'rm', '-f', name], capture_output=True)
        subprocess.run(['docker', 'network', 'rm', self.network], capture_output=True)

    def set_state(self, mode, name='Campus A'):
        self.state.write_text(json.dumps({'mode': mode, 'name': name}))

    def request(self, url):
        code = '''
import json, sys, urllib.request, urllib.error
request = urllib.request.Request('http://gateway' + sys.argv[1], headers={
    'Host': 'campus.example.org', 'Cookie': 'sessionid=test', 'Authorization': 'Bearer test',
    'X-Forwarded-Proto': 'https'})
try:
    response = urllib.request.urlopen(request, timeout=8)
except urllib.error.HTTPError as error:
    response = error
print(json.dumps({'status': response.status, 'headers': dict(response.headers), 'body': response.read().decode()}))
'''
        return json.loads(self.docker('exec', self.web, 'python', '-c', code, url))

    def test_documents_use_fresh_config_and_retain_failure_recovery_and_admin_csp(self):
        for url in ('/', '/review/course', '/manage', '/manage/files',
                    '/user/forget-password?source=email', '/index.html'):
            with self.subTest(url=url):
                response = self.request(url)
                self.assertEqual(response['status'], 200)
                self.assertEqual(response['body'].count('id="site-config-bootstrap"'), 1)
                self.assertIn('Campus A', response['body'])
                self.assertIn('"has_cookie": false', response['body'])
                self.assertIn('"has_authorization": false', response['body'])
                self.assertIn('data-site-loading', response['body'])
                self.assertIn('no-store', response['headers']['Cache-Control'])
                self.assertNotIn('<!--#', response['body'])
                if url.startswith('/manage'):
                    self.assertIn("script-src 'self' moz-extension: chrome-extension:;", response['body'])
                    self.assertIn("connect-src 'self';", response['headers']['Content-Security-Policy'])
        self.set_state('ok', 'Campus B')
        self.assertIn('Campus B', self.request('/')['body'])
        direct = self.request('/_site/bootstrap')
        self.assertEqual(direct['status'], 204)
        self.assertEqual(direct['body'], '')
        for mode in ('error', 'slow'):
            self.set_state(mode)
            started = time.monotonic()
            response = self.request('/')
            self.assertLess(time.monotonic() - started, 5)
            self.assertEqual(response['status'], 200)
            self.assertIn('data-site-loading', response['body'])
            self.assertNotIn('id="site-config-bootstrap"', response['body'])
            self.assertNotIn('UPSTREAM_ERROR_SHOULD_NOT_LEAK', response['body'])


if __name__ == '__main__':
    unittest.main()
