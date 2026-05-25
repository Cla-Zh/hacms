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

# Get the SHA of the initial commit on master
r = requests.get(f"{API}/repos/{GITHUB_USER}/{GITHUB_REPO}/git/refs/heads/master", auth=AUTH, headers=headers, timeout=15)
print(f"GET /git/refs/heads/master: {r.status_code}")
if r.status_code == 200:
    print(json.dumps(r.json(), indent=2))
else:
    print(r.text[:300])

# Also try main branch
r2 = requests.get(f"{API}/repos/{GITHUB_USER}/{GITHUB_REPO}/git/refs/heads/main", auth=AUTH, headers=headers, timeout=15)
print(f"\nGET /git/refs/heads/main: {r2.status_code}")
if r2.status_code == 200:
    print(json.dumps(r2.json(), indent=2))
else:
    print(r2.text[:300])

# Try creating a blob directly
blob_payload = {"content": "test content", "encoding": "utf-8"}
r3 = requests.post(f"{API}/repos/{GITHUB_USER}/{GITHUB_REPO}/git/blobs", auth=AUTH, headers=headers, json=blob_payload, timeout=15)
print(f"\nPOST /git/blobs: {r3.status_code}")
if r3.status_code in (200, 201):
    print(json.dumps(r3.json(), indent=2))
else:
    print(r3.text[:300])

print("\n=== Auth test ===")
# Verify auth is valid for repo operations
r4 = requests.get(f"{API}/repos/{GITHUB_USER}/{GITHUB_REPO}", auth=AUTH, headers=headers, timeout=15)
print(f"GET repo: {r4.status_code}")
print(f"Permissions: {r4.json().get('permissions', {})}")

print("\nDone!")