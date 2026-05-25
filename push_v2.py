import requests
import base64
import json
import os
import time

GITHUB_USER = "Cla-Zh"
GITHUB_REPO = "hacms"
TOKEN = "Calvin25165"
AUTH = requests.auth.HTTPBasicAuth(GITHUB_USER, TOKEN)
API = "https://api.github.com"
headers = {"Accept": "application/vnd.github.v3+json"}

BASE = f"{API}/repos/{GITHUB_USER}/{GITHUB_REPO}/contents"
LOCAL_BASE = r"C:\Users\Administrator\.openclaw\workspace\aam-cms"

def create_or_update_file(path, content_b64, is_new=False):
    url = f"{BASE}/{path}"
    payload = {
        "message": f"Initialize {path}",
        "content": content_b64,
    }
    r = requests.get(url, auth=AUTH, headers=headers, timeout=10)
    if r.status_code == 200:
        payload["sha"] = r.json()["sha"]
    r2 = requests.put(url, auth=AUTH, headers=headers, json=payload, timeout=30)
    return r2

# Test: create README first (works for new repos with no commits)
readme_content = base64.b64encode(open(os.path.join(LOCAL_BASE, "README.md"), "rb").read()).decode()
r = create_or_update_file("README.md", readme_content)
print(f"README: {r.status_code}")
print(r.text[:300])

if r.status_code in (200, 201):
    print("\nFirst file created! Now pushing all other files...")
    
    for root, dirs, files in os.walk(LOCAL_BASE):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for file in files:
            if file in ['README.md', 'push_github.py', 'test_auth.py', 'check_branches.py']:
                continue
            if file.startswith('.'):
                continue
            full = os.path.join(root, file)
            rel = os.path.relpath(full, LOCAL_BASE).replace(os.sep, '/')
            
            with open(full, 'rb') as f:
                content = base64.b64encode(f.read()).decode()
            
            r = create_or_update_file(rel, content)
            status = r.status_code
            print(f"  {rel}: {status}")
            if status not in (200, 201):
                print(f"    {r.text[:150]}")
            
            time.sleep(0.6)
    
    print("\n=== All done! ===")
else:
    print(f"\nFailed: {r.status_code} - {r.text[:500]}")