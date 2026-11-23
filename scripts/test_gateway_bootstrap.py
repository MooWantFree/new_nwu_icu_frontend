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
        resources = directory / 'resources'
        resources.mkdir(mode=0o755)
        (resources / 'example.txt').write_bytes(b'0123456789')
        (directory / 'server.py').write_text('''
import json, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/gateway-error/':
            self.close_connection = True
            return
        if self.path == '/api/resources/file/example.txt':
            self.send_response(200)
            self.send_header('X-Accel-Redirect', '/_protected/resources/example.txt')
            self.send_header('ETag', '"range-fixture"')
            self.end_headers()
            return
        if self.path in ('/disk', '/api/test/', '/admin/'):
            self.send_response(200)
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('X-Frame-Options', 'DENY')
            self.send_header('Referrer-Policy', 'no-referrer')
            self.end_headers()
            return
        print('bootstrap-request', flush=True)
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
                    '-v', f'{ROOT / "nginx/snippets"}:/etc/nginx/snippets:ro',
                    '-v', f'{resources}:/srv/resources:ro',
                    '-v', f'{ROOT / "nginx/zip-download-limit.conf"}:/etc/nginx/conf.d/00-zip-download-limit.conf:ro',
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

    def request(self, url, headers=None):
        code = '''
import json, sys, urllib.request, urllib.error
request = urllib.request.Request('http://gateway' + sys.argv[1], headers={
    'Host': 'campus.example.org', 'Cookie': 'sessionid=test', 'Authorization': 'Bearer test',
    'X-Forwarded-Proto': 'https', **json.loads(sys.argv[2])})
try:
    response = urllib.request.urlopen(request, timeout=8)
except urllib.error.HTTPError as error:
    response = error
headers = {key: response.headers.get_all(key) for key in response.headers}
print(json.dumps({'status': response.status, 'headers': headers, 'body': response.read().decode()}))
'''
        return json.loads(self.docker('exec', self.web, 'python', '-c', code, url, json.dumps(headers or {})))

    def assert_security_headers(self, response, frame_options):
        headers = response['headers']
        self.assertEqual(headers.get('X-Content-Type-Options'), ['nosniff'])
        self.assertEqual(headers.get('X-Frame-Options'), [frame_options])
        self.assertEqual(headers.get('Referrer-Policy'), ['no-referrer'])

    def test_security_headers_on_static_proxied_and_error_responses(self):
        asset = next((ROOT / 'dist/assets').glob('*.css'))
        for path, status, frames in (
            ('/assets/' + asset.name, 200, 'SAMEORIGIN'),
            ('/assets/missing-fixture.css', 404, 'SAMEORIGIN'),
            ('/resource-entry.js', 200, 'SAMEORIGIN'),
            ('/media/private', 404, 'SAMEORIGIN'),
            ('/disk', 200, 'DENY'), ('/api/test/', 200, 'DENY'), ('/admin/', 200, 'DENY'),
            ('/api/gateway-error/', 502, 'SAMEORIGIN'),
        ):
            with self.subTest(path=path):
                response = self.request(path)
                self.assertEqual(response['status'], status)
                self.assert_security_headers(response, frames)

        response = self.request('/api/resources/file/example.txt', {'Range': 'bytes=2-4'})
        self.assertEqual(response['status'], 206)
        self.assertEqual(response['body'], '234')
        self.assertEqual(response['headers']['Content-Range'], ['bytes 2-4/10'])
        self.assertEqual(response['headers']['ETag'], ['"range-fixture"'])
        self.assertEqual(response['headers']['Content-Security-Policy'], ["sandbox; default-src 'none'"])
        self.assert_security_headers(response, 'SAMEORIGIN')

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
                self.assert_security_headers(response, 'DENY' if url.startswith('/manage') else 'SAMEORIGIN')
                if url.startswith('/manage'):
                    self.assertIn("script-src 'self' moz-extension: chrome-extension:;", response['body'])
                    self.assertIn("connect-src 'self';", response['headers']['Content-Security-Policy'][0])
        self.set_state('ok', 'Campus B')
        self.assertIn('Campus B', self.request('/')['body'])
        direct = self.request('/_site/bootstrap')
        self.assertEqual(direct['status'], 204)
        self.assertEqual(direct['body'], '')
        for mode in ('error', 'slow'):
            self.set_state(mode)
            before = self.docker('logs', self.web).count('bootstrap-request')
            self.docker('exec', self.gateway, 'wget', '-q', '--spider',
                        'http://127.0.0.1/startup.css')
            self.assertEqual(self.docker('logs', self.web).count('bootstrap-request'), before)
            started = time.monotonic()
            response = self.request('/')
            self.assertLess(time.monotonic() - started, 5)
            self.assertEqual(response['status'], 200)
            self.assertIn('data-site-loading', response['body'])
            self.assertNotIn('id="site-config-bootstrap"', response['body'])
            self.assertNotIn('UPSTREAM_ERROR_SHOULD_NOT_LEAK', response['body'])


if __name__ == '__main__':
    unittest.main()
