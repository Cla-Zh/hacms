#!/usr/bin/env python3
import base64, http.client, warnings
warnings.filterwarnings('ignore')

EMAIL = "myzqz@163.com"
PASS = "Calvin25165"

# Check if the account exists at all by comparing error messages
# Try with wrong password to see if error is the same
creds_wrong = base64.b64encode(f"{EMAIL}:wrongpassword123".encode()).decode()
creds_right = base64.b64encode(f"{EMAIL}:{PASS}".encode()).decode()

print("=== Testing with WRONG password ===")
conn = http.client.HTTPSConnection("api.github.com", timeout=15)
conn.request("GET", "/user", headers={
    "Authorization": f"Basic {creds_wrong}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "AAM-CMS-Push/1.0"
})
resp = conn.getresponse()
body = resp.read().decode()
print(f"Status: {resp.status}, Body: {body[:200]}")
conn.close()

print("\n=== Testing with PROVIDED password ===")
conn2 = http.client.HTTPSConnection("api.github.com", timeout=15)
conn2.request("GET", "/user", headers={
    "Authorization": f"Basic {creds_right}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "AAM-CMS-Push/1.0"
})
resp2 = conn2.getresponse()
body2 = resp2.read().decode()
print(f"Status: {resp2.status}, Body: {body2[:200]}")
conn2.close()

# Also check: does GitHub OAuth work?
print("\n=== Testing GitHub OAuth Device Flow (public info) ===")
conn3 = http.client.HTTPSConnection("github.com", timeout=15)
conn3.request("GET", "/login/device/code?client_id=Iv1.1&scope=repo", headers={
    "User-Agent": "AAM-CMS-Push/1.0",
    "Accept": "application/json"
})
resp3 = conn3.getresponse()
body3 = resp3.read().decode()
print(f"Status: {resp3.status}, Body: {body3[:200]}")
conn3.close()