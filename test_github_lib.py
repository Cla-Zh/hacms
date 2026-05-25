from github import Github
import base64, os

# Try with username as token (some tokens work this way)
g = Github("myzqz@163.com", "Calvin25165")
try:
    user = g.get_user()
    print(f"User: {user.login}")
    print(f"Type: {user.type}")
except Exception as e:
    print(f"Auth failed: {e}")

# Try with just the token
g2 = Github("Calvin25165")
try:
    user2 = g2.get_user()
    print(f"\nToken-only User: {user2.login}")
except Exception as e:
    print(f"\nToken-only auth failed: {e}")
    
print("\nDone!")