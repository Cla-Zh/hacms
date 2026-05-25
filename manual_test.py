#!/usr/bin/env python3
import base64, ssl, socket, http.client, warnings
warnings.filterwarnings('ignore')

EMAIL = "myzqz@163.com"
PASS = "Calvin25165"

# Manual HTTPS connection to check what GitHub sees
credentials = base64.b64encode(f"{EMAIL}:{PASS}".encode()).decode()
print(f"Credentials: {credentials[:20]}...")

conn = http.client.HTTPSConnection("api.github.com", timeout=15)
conn.request("GET", "/user", headers={
    "Authorization": f"Basic {credentials}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "AAM-CMS-Push/1.0",
    "Host": "api.github.com"
})
resp = conn.getresponse()
body = resp.read().decode()
print(f"Status: {resp.status}")
print(f"Body: {body[:300]}")
conn.close()