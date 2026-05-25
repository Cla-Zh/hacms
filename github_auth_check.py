#!/usr/bin/env python3
"""GitHub File Pusher for AAM-CMS"""
import base64, json, os, time, ssl, warnings
warnings.filterwarnings('ignore')

import requests

USER = "Cla-Zh"
EMAIL = "myzqz@163.com"
PASS = "Calvin25165"
REPO = "hacms"
API = "https://api.github.com"
AUTH = requests.auth.HTTPBasicAuth(EMAIL, PASS)
HDRS = {"Accept": "application/vnd.github.v3+json", "User-Agent": "AAM-CMS-Push/1.0"}
LOCAL = r"C:\Users\Administrator\.openclaw\workspace\aam-cms"

s = requests.Session()
s.auth = AUTH
s.headers.update(HDRS)

def get(path):
    return s.get(f"{API}{path}", timeout=15)

def get_file(path):
    return s.get(f"{API}/repos/{USER}/{REPO}/contents/{path}", timeout=15)

def upsert_file(path, content_b64, msg="Update"):
    r = get_file(path)
    sha = r.json()['sha'] if r.status_code == 200 else None
    payload = {"message": msg, "content": content_b64}
    if sha:
        payload["sha"] = sha
    return s.put(f"{API}/repos/{USER}/{REPO}/contents/{path}", json=payload, timeout=30)

# Step 1: Auth test
print("=== Auth Test ===")
r = get("/user")
print(f"GET /user: {r.status_code}")
if r.status_code == 200:
    me = r.json()
    print(f"  Logged in as: {me.get('login')} ({me.get('name')})")
else:
    print(f"  Failed: {r.text[:200]}")
    print("\nCannot proceed.")
    exit(1)

# Step 2: Check repo
print("\n=== Repo Check ===")
r = get(f"/repos/{USER}/{REPO}")
print(f"GET /repos/{USER}/{REPO}: {r.status_code}")
if r.status_code == 200:
    print(f"  Default branch: {r.json().get('default_branch')}, Empty: {r.json().get('empty')}")

# Step 3: Check master ref (empty repo = 409)
r = get(f"/repos/{USER}/{REPO}/git/refs/heads/master")
print(f"\nGET /git/refs/heads/master: {r.status_code} - {r.text[:100]}")

# Step 4: Rate limit
r = get("/rate_limit")
if r.status_code == 200:
    rl = r.json()['rate']
    print(f"\nRate limit: {rl['remaining']}/{rl['limit']}")

print("\n=== Done ===")