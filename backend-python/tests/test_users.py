import pytest

@pytest.mark.asyncio
async def test_user_profile_and_settings(client):
    # 1. Login
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": "demo@akashagent.dev", "password": "demo123"}
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get profile
    prof_resp = await client.get("/api/user/profile", headers=headers)
    assert prof_resp.status_code == 200
    prof_data = prof_resp.json()
    assert prof_data["success"] is True
    assert prof_data["user"]["email"] == "demo@akashagent.dev"

    # 3. Update settings
    settings_payload = {
        "settings": {
            "defaultModel": "gemini",
            "temperature": 0.7,
            "theme": "dark"
        }
    }
    update_resp = await client.put("/api/user/settings", json=settings_payload, headers=headers)
    assert update_resp.status_code == 200
    update_data = update_resp.json()
    assert update_data["success"] is True
    assert update_data["settings"]["theme"] == "dark"

    # 4. Get memories
    mem_resp = await client.get("/api/user/memories", headers=headers)
    assert mem_resp.status_code == 200
    assert mem_resp.json()["success"] is True
