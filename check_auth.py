#!/usr/bin/env python3
"""Create a NEW repo and push to it via GitHub API v3."""
import requests, base64, json, os, time

USER = "Cla-Zh"
EMAIL = "myzqz@163.com"
PASS = "Calvin25165"
REPO = "hacms"
API = "https://api.github.com"
AUTH = requests.auth.HTTPBasicAuth(EMAIL, PASS)
HDRS = {"Accept": "application/vnd.github.v3+json"}

LOCAL = r"C:\Users\Administrator\.openclaw\workspace\aam-cms"

# Check auth
r = requests.get(f"{API}/user", auth=AUTH, headers=HDRS, timeout=15)
print(f"GET /user: {r.status_code}")
if r.status_code == 200:
    me = r.json()
    print(f"  Logged in as: {me.get('login')} ({me.get('name')})")
    print(f"  Plan: {me.get('plan', {}).get('name')}")
else:
    print(f"  Auth failed: {r.text[:200]}")
    print("\nCannot proceed without valid auth. Check credentials.")
    exit(1)

# Check if repo exists
r2 = requests.get(f"{API}/repos/{USER}/{REPO}", auth=AUTH, headers=HDRS, timeout=15)
print(f"\nGET /repos/{USER}/{REPO}: {r2.status_code}")
if r2.status_code == 200:
    print(f"  Repo exists, default branch: {r2.json().get('default_branch')}")
    print(f"  Private: {r2.json().get('private')}")
else:
    print(f"  Repo not accessible: {r2.text[:200]}")

# Get current branches
r3 = requests.get(f"{API}/repos/{USER}/{REPO}/branches", auth=AUTH, headers=HDRS, timeout=15)
print(f"\nGET /repos/{USER}/{REPO}/branches: {r3.status_code}")
if r3.status_code == 200:
    print(f"  Branches: {[b['name'] for b in r3.json()]}")
else:
    print(f"  {r3.text[:200]}")

# Get rate limit
r4 = requests.get(f"{API}/rate_limit", auth=AUTH, headers=HDRS, timeout=15)
if r4.status_code == 200:
    rl = r4.json()['rate']
    print(f"\nRate limit: {rl['remaining']}/{rl['limit']}, resets at {time.ctime(rl['reset'])}")

print("\nDone!")