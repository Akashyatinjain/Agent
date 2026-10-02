import httpx

client = httpx.Client(base_url="http://localhost:5000", timeout=15.0)

# 1. Login
r = client.post("/api/auth/login", json={"email": "demo@akashagent.dev", "password": "demo123"})
print("1. Login status:", r.status_code)
assert r.status_code == 200, f"Login failed: {r.text}"
token = r.json()["token"]
user = r.json()["user"]
print(f"   Logged in as: {user['name']} ({user['email']})")

headers = {"Authorization": f"Bearer {token}"}

# 2. Get conversations
r = client.get("/api/chat/conversations", headers=headers)
print("2. Conversations status:", r.status_code)
assert r.status_code == 200
convs = r.json().get("conversations", [])
print(f"   Total conversations in database: {len(convs)}")

# 3. Open old conversations
if convs:
    for i, conv in enumerate(convs[:3]):
        cid = conv["id"]
        title = conv.get("title", "Untitled")
        r_det = client.get(f"/api/chat/conversations/{cid}", headers=headers)
        assert r_det.status_code == 200, f"Failed to fetch conversation {cid}: {r_det.text}"
        detail = r_det.json()
        assert detail.get("success") is True
        c_obj = detail.get("conversation", {})
        msgs = c_obj.get("messages", [])
        print(f"   [Conv {i+1}] ID: {cid} | Title: '{title}' | Messages: {len(msgs)}")
        for m in msgs[:2]:
            print(f"       -> {m.get('role')}: {m.get('content', '')[:50]}")
    print("\n[OK] Old conversations opening test: 100% PASSED!")
else:
    print("No conversations found to test opening.")

# 4. Profile & settings
r_prof = client.get("/api/user/profile", headers=headers)
assert r_prof.status_code == 200
print("4. User profile:", r_prof.json()["user"]["name"])

# 5. Health
r_health = client.get("/api/health")
assert r_health.status_code == 200
print("5. Health check:", r_health.json()["status"])

print("\n[SUCCESS] ALL END-TO-END CHECKS COMPLETED SUCCESSFULLY!")
