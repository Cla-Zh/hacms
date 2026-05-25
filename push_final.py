#!/usr/bin/env python3
"""
GitHub HTTPS Push via Python - No Git CLI Required.
Uses GitHub REST API v3 to push AAM-CMS files.
"""
import base64, json, os, time, warnings
warnings.filterwarnings('ignore')
import requests

USER = "Cla-Zh"
EMAIL = "myzqz@163.com"
PASS = "Calvin25165"
REPO = "hacms"
API = "https://api.github.com"
AUTH = requests.auth.HTTPBasicAuth(EMAIL, PASS)
HDRS = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "AAM-CMS-Push/1.0"
}
LOCAL = r"C:\Users\Administrator\.openclaw\workspace\aam-cms"
BASE_URL = f"{API}/repos/{USER}/{REPO}/contents"

session = requests.Session()
session.auth = AUTH
session.headers.update(HDRS)

def get(path):
    return session.get(f"{API}{path}", timeout=15)

def get_content(path):
    """Get file SHA for update, returns (status, sha_or_None)"""
    r = session.get(f"{BASE_URL}/{path}", timeout=15)
    if r.status_code == 200:
        return (200, r.json().get('sha'))
    return (r.status_code, None)

def upsert(path, content_b64, msg):
    """PUT create or update a file"""
    status, sha = get_content(path)
    payload = {"message": msg, "content": content_b64}
    if sha:
        payload["sha"] = sha
    r = session.put(f"{BASE_URL}/{path}", json=payload, timeout=30)
    return r

def read_file(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode()

# ============================================================
# Step 1: Auth check
# ============================================================
print("=" * 60)
print("STEP 1: Authentication")
print("=" * 60)
r = get("/user")
print(f"GET /user => {r.status_code}")
if r.status_code == 200:
    me = r.json()
    print(f"  Authenticated as: {me.get('login')} ({me.get('name')})")
else:
    print(f"  FAILED: {r.text[:300]}")
    print("\nCannot proceed. Please check credentials.")
    exit(1)

# ============================================================
# Step 2: Repo status
# ============================================================
print("\n" + "=" * 60)
print("STEP 2: Repository Status")
print("=" * 60)
r = get(f"/repos/{USER}/{REPO}")
print(f"GET /repos/{USER}/{REPO} => {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"  Default branch: {data.get('default_branch')}")
    print(f"  Empty repo: {data.get('empty')}")
    print(f"  Has wiki: {data.get('has_wiki')}")

# Check if repo is empty
r2 = get(f"/repos/{USER}/{REPO}/git/refs/heads")
print(f"\nGET /git/refs/heads => {r2.status_code}")
if r2.status_code == 200:
    print(f"  Branches: {[b['ref'] for b in r2.json()]}")
else:
    print(f"  {r2.text[:100]}")

# ============================================================
# Step 3: Push all files
# ============================================================
print("\n" + "=" * 60)
print("STEP 3: Pushing Files")
print("=" * 60)

if r.status_code != 200:
    print("Cannot push - repo not accessible.")
    exit(1)

pushed = []
errors = []

for root, dirs, files in os.walk(LOCAL):
    # Skip .git and hidden dirs
    dirs[:] = [d for d in dirs if not d.startswith('.')]
    for file in files:
        if file.startswith('.'):
            continue
        # Skip helper scripts
        if file in ('push_github.py', 'test_auth.py', 'push_v2.py', 'check_branches.py',
                    'debug_api.py', 'auth_test.js', 'auth_test2.js', 'auth_test3.js',
                    'network_test.js', 'test_ua.js', 'test_dotnet.ps1', 'test_dotnet2.ps1',
                    'github_auth_check.py', 'push_pygithub.py', 'test_auth_v2.py',
                    'start_ssh_agent.bat', 'test_github_lib.py'):
            continue

        full_path = os.path.join(root, file)
        rel_path = os.path.relpath(full_path, LOCAL).replace(os.sep, '/')

        try:
            content_b64 = read_file(full_path)
            r = upsert(rel_path, content_b64, f"Add {rel_path}")
            if r.status_code in (200, 201):
                print(f"  ✓ {rel_path}")
                pushed.append(rel_path)
            else:
                print(f"  ✗ {rel_path}: {r.status_code} {r.text[:100]}")
                errors.append((rel_path, r.status_code, r.text[:100]))
        except Exception as e:
            print(f"  ✗ {rel_path}: ERROR {e}")
            errors.append((rel_path, -1, str(e)))

        time.sleep(0.5)  # Be nice to the API

# ============================================================
# Summary
# ============================================================
print("\n" + "=" * 60)
print(f"RESULTS: {len(pushed)} pushed, {len(errors)} errors")
print("=" * 60)
if errors:
    print("\nErrors:")
    for path, code, msg in errors:
        print(f"  {path}: [{code}] {msg}")
else:
    print("\nAll files pushed successfully!")
    print(f"\nView at: https://github.com/{USER}/{REPO}")