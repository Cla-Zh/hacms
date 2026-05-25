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

# Test different auth scenarios
print("=== Auth Test ===")
r = requests.get(f"{API}/user", auth=AUTH, headers=headers, timeout=15)
print(f"/user: {r.status_code}")
if r.status_code == 200:
    print(f"  User: {r.json().get('login')}")
elif r.status_code == 401:
    print("  401 Unauthorized - checking if token works...")
    # Try with just the token as Bearer
    r2 = requests.get(f"{API}/user", headers={**headers, "Authorization": f"token {TOKEN}"}, timeout=15)
    print(f"  Bearer token /user: {r2.status_code}")
    if r2.status_code == 200:
        print(f"  User (bearer): {r2.json().get('login')}")

print("\n=== Repo Access ===")
r = requests.get(f"{API}/repos/{GITHUB_USER}/{GITHUB_REPO}", auth=AUTH, headers=headers, timeout=15)
print(f"GET repo: {r.status_code}")
if r.status_code == 200:
    print(f"  Repo: {r.json().get('full_name')}, private={r.json().get('private')}")
    print(f"  Permissions: {r.json().get('permissions')}")

print("\n=== Branch ===")
r = requests.get(f"{API}/repos/{GITHUB_USER}/{GITHUB_REPO}/branches/master", auth=AUTH, headers=headers, timeout=15)
print(f"GET branch: {r.status_code}")
if r.status_code == 200:
    print(f"  Branch: {r.json().get('name')}, commit={r.json().get('commit', {}).get('sha')}")

print("\nDone!")