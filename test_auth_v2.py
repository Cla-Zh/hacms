from github import Github
import base64, os, sys
from github.Auth import Login

GITHUB_USER = "Cla-Zh"
GITHUB_REPO = "hacms"
LOCAL_BASE = r"C:\Users\Administrator\.openclaw\workspace\aam-cms"

# Try various auth approaches
attempts = [
    ("Login+Password", lambda: Login(GITHUB_USER, "Calvin25165")),
    ("Email+Password", lambda: Login("myzqz@163.com", "Calvin25165")),
    ("Token only", lambda: Login(token="Calvin25165")),
]

for name, auth_fn in attempts:
    print(f"\n--- Trying {name} ---")
    try:
        g = Github(auth=auth_fn())
        u = g.get_user()
        print(f"  Authenticated as: {u.login}")
        break
    except Exception as e:
        print(f"  Failed: {e}")
else:
    print("\nAll auth methods failed.")
    sys.exit(1)

repo = g.get_repo(f"{GITHUB_USER}/{GITHUB_REPO}")
print(f"Repo: {repo.full_name}, Empty: {repo.empty}")

# Check if we can create content
print("\nChecking write permissions...")
try:
    # Try to list contents (works if repo is accessible)
    contents = repo.get_contents("")
    print(f"Contents accessible, {len(contents)} items at root")
except Exception as e:
    print(f"Cannot list contents: {e}")

# Check rate limit
rate = g.get_rate_limit()
print(f"\nRate limit: {rate.core.remaining}/{rate.core.limit}")

print("\nDone!")