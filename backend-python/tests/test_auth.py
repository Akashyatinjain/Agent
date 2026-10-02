import pytest

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "akashagent-backend"
    assert "uptime" in data

@pytest.mark.asyncio
async def test_demo_login_and_me(client):
    # Login with demo user
    response = await client.post(
        "/api/auth/login",
        json={"email": "demo@akashagent.dev", "password": "demo123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["email"] == "demo@akashagent.dev"

    token = data["token"]

    # Access /api/auth/me
    me_response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["success"] is True
    assert me_data["user"]["email"] == "demo@akashagent.dev"

@pytest.mark.asyncio
async def test_invalid_login(client):
    response = await client.post(
        "/api/auth/login",
        json={"email": "nonexistent_random_user@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_CREDENTIALS"

@pytest.mark.asyncio
async def test_me_without_token(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "TOKEN_MISSING"
