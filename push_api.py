#!/usr/bin/env python3
"""Push AAM-CMS to GitHub using the PAT via REST API v3"""
import base64, json, os, time, ssl, http.client, warnings
warnings.filterwarnings('ignore')

PAT = 'YOUR_PAT_HERE'  # TODO: 使用环境变量或密钥管理
USER = 'Cla-Zh'
REPO = 'hacms'
LOCAL = r"C:\Users\Administrator\.openclaw\workspace\aam-cms"

# Helper files to skip
SKIP = {
    'push_github.py', 'test_auth.py', 'push_v2.py', 'check_branches.py',
    'debug_api.py', 'auth_test.js', 'auth_test2.js', 'auth_test3.js',
    'network_test.js', 'test_ua.js', 'test_dotnet.ps1', 'test_dotnet2.ps1',
    'github_auth_check.py', 'push_pygithub.py', 'test_auth_v2.py',
    'start_ssh_agent.bat', 'test_github_lib.py', 'manual_test.py',
    'compare_auth.py', 'connection_test.js', 'push_final.py',
    'push_api.py', '.gitignore',
}

def api(path, method='GET', body=None, token=PAT):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    conn = http.client.HTTPSConnection('api.github.com', timeout=30, context=ctx)
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AAM-CMS-Push/1.0',
        'Content-Type': 'application/json'
    }
    if body:
        body = json.dumps(body).encode()
        headers['Content-Length'] = str(len(body))
    conn.request(method, path, body=body, headers=headers)
    r = conn.getresponse()
    data = r.read()
    conn.close()
    return r.status, data

def get_sha(path):
    status, data = api(f'/repos/{USER}/{REPO}/contents/{path}')
    if status == 200:
        return json.loads(data)['sha']
    return None

def upsert_file(rel_path, content_b64, msg='Add/update file'):
    payload = {'message': msg, 'content': content_b64}
    sha = get_sha(rel_path)
    if sha:
        payload['sha'] = sha
    return api(f'/repos/{USER}/{REPO}/contents/{rel_path}', 'PUT', payload)

# --- Main ---
print("=== AAM-CMS GitHub Push via API ===\n")

# Auth
status, data = api('/user')
if status == 200:
    me = json.loads(data)
    print(f"[OK] Authenticated as: {me['login']}")
else:
    print(f"[FAIL] Auth: {status}")
    exit(1)

# Repo check
status, data = api(f'/repos/{USER}/{REPO}')
if status == 200:
    repo = json.loads(data)
    print(f"[OK] Repo: {repo['full_name']}, branch: {repo['default_branch']}, empty: {repo.get('empty', False)}")
else:
    print(f"[FAIL] Repo: {status}")
    exit(1)

# Push files
print("\n=== Pushing files ===")
pushed = 0
errors = []

for root, dirs, files in os.walk(LOCAL):
    dirs[:] = [d for d in dirs if not d.startswith('.')]
    for file in files:
        if file.startswith('.'):
            continue
        if file in SKIP:
            continue
        full = os.path.join(root, file)
        rel = os.path.relpath(full, LOCAL).replace(os.sep, '/')
        try:
            with open(full, 'rb') as f:
                content_b64 = base64.b64encode(f.read()).decode()
            status, data = upsert_file(rel, content_b64, f'Add {rel}')
            if status in (200, 201):
                print(f"  [OK] {rel}")
                pushed += 1
            else:
                err = data.decode()[:150] if isinstance(data, bytes) else str(data)[:150]
                print(f"  [FAIL] {rel}: [{status}] {err}")
                errors.append((rel, status, err))
        except Exception as e:
            print(f"  [ERROR] {rel}: {e}")
            errors.append((rel, -1, str(e)))
        time.sleep(0.5)

# Results
print(f"\n{'='*50}")
print(f"RESULT: {pushed} files pushed, {len(errors)} errors")
if errors:
    print("\nErrors:")
    for p, c, m in errors:
        print(f"  {p}: [{c}] {m}")
else:
    print(f"\nDone! https://github.com/{USER}/{REPO}")
print(f"{'='*50}")