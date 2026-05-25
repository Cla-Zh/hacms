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

# Check branches
r = requests.get(f"{API}/repos/{GITHUB_USER}/{GITHUB_REPO}/branches", auth=AUTH, headers=headers, timeout=15)
print(f"Branches: {r.status_code}")
if r.status_code == 200:
    print(json.dumps(r.json(), indent=2))

# Check default branch
r2 = requests.get(f"{API}/repos/{GITHUB_USER}/{GITHUB_REPO}", auth=AUTH, headers=headers, timeout=15)
if r2.status_code == 200:
    print(f"Default branch: {r2.json().get('default_branch')}")
    print(f"Full name: {r2.json().get('full_name')}")

print("\nDone!")