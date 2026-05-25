#!/usr/bin/env python3
"""Push AAM-CMS to GitHub using PyGithub.
Works for empty repos by creating the initial commit."""
import base64, os, time, sys
from github import Github

GITHUB_USER = "Cla-Zh"
GITHUB_REPO = "hacms"
EMAIL = "myzqz@163.com"
PASSWORD = "Calvin25165"
LOCAL_BASE = r"C:\Users\Administrator\.openclaw\workspace\aam-cms"

print("Authenticating...")
g = Github(EMAIL, PASSWORD)

try:
    g.get_user().login
    print("Auth OK")
except Exception as e:
    print(f"Auth failed: {e}")
    sys.exit(1)

repo = g.get_repo(f"{GITHUB_USER}/{GITHUB_REPO}")
print(f"Repo: {repo.full_name}, Default branch: {repo.default_branch}")

# Check existing branches
print("\nChecking existing branches...")
try:
    branches = repo.get_branches()
    print(f"Branches: {[b.name for b in branches]}")
except Exception as e:
    print(f"No branches yet: {e}")

# Get the empty repo flag
print(f"Repo is empty? {repo.empty}")

# Try to get master ref (will fail for empty repo)
try:
    ref = repo.get_git_ref("heads/master")
    print(f"master exists: {ref.ref}")
except:
    print("No master branch yet")

# Get the default branch ref
try:
    ref_main = repo.get_git_ref(f"heads/{repo.default_branch}")
    print(f"{repo.default_branch} ref: {ref_main.ref}")
except Exception as e:
    print(f"No {repo.default_branch} branch yet: {e}")

print("\nTrying to create initial commit on master...")

# For empty repos we need to create the branch first
# Step 1: Create a blob
test_content = "Hello from AAM-CMS v2.0"
blob = repo.create_git_blob(test_content, "utf-8")
print(f"Blob SHA: {blob.sha}")

# Step 2: Create a tree
tree = repo.create_git_tree([
    {
        "path": "README.md",
        "mode": "100644",
        "type": "blob",
        "sha": blob.sha
    }
])
print(f"Tree SHA: {tree.sha}")

# Step 3: Create a commit
commit = repo.create_git_commit(
    message="Initial commit: AAM-CMS v2.0",
    tree=tree.sha,
    parents=[]
)
print(f"Commit SHA: {commit.sha}")

# Step 4: Create the master branch pointing to this commit
try:
    repo.create_git_ref(ref="refs/heads/master", sha=commit.sha)
    print("master branch created!")
except Exception as e:
    print(f"Failed to create branch: {e}")

print("\nDone!")