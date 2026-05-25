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

# Test: create a simple file first
test_content = base64.b64encode(b"test").decode()
r = requests.put(
    f"{BASE}/test.txt",
    auth=AUTH,
    headers=headers,
    json={"message": "test commit", "content": test_content},
    timeout=30
)
print(f"Test PUT: {r.status_code}")
print(r.text[:300])

if r.status_code in (200, 201):
    print("\nAuth works! Proceeding with all files...")
    
    for root, dirs, files in os.walk(LOCAL_BASE):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for file in files:
            if file.startswith('.') or file in ['push_github.py', 'test_auth.py']:
                continue
            full = os.path.join(root, file)
            rel = os.path.relpath(full, LOCAL_BASE).replace(os.sep, '/')
            
            with open(full, 'rb') as f:
                content = base64.b64encode(f.read()).decode()
            
            url = f"{BASE}/{rel}"
            r2 = requests.get(url, auth=AUTH, headers=headers, timeout=10)
            sha = r2.json()['sha'] if r2.status_code == 200 else None
            
            payload = {"message": f"Add {rel}", "content": content}
            if sha:
                payload["sha"] = sha
            
            r3 = requests.put(url, auth=AUTH, headers=headers, json=payload, timeout=30)
            print(f"  PUT {rel}: {r3.status_code}")
            if r3.status_code not in (200, 201):
                print(f"    {r3.text[:150]}")
            
            time.sleep(0.5)
    
    print("\nDone!")
else:
    print(f"\nAuth doesn't support writes. Status: {r.status_code}")
    print("Need to find alternative push method.")