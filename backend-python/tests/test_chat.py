import pytest
import json

@pytest.mark.asyncio
async def test_chat_conversations_and_stream(client):
    # 1. Login
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": "demo@akashagent.dev", "password": "demo123"}
    )
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. List conversations
    convs_resp = await client.get("/api/chat/conversations", headers=headers)
    assert convs_resp.status_code == 200
    assert convs_resp.json()["success"] is True

    # 3. Stream a message
    stream_resp = await client.post(
        "/api/chat/message",
        json={"message": "Calculate 50 + 50", "model": "gemini", "isStream": True},
        headers=headers
    )
    assert stream_resp.status_code == 200
    assert "text/event-stream" in stream_resp.headers["content-type"]

    body = stream_resp.text
    assert "event: metadata" in body
    assert "event: token" in body
    assert "event: end" in body

    # Extract conversationId from metadata
    meta_line = [l for l in body.split("\n") if "conversationId" in l][0]
    conv_id = json.loads(meta_line.replace("data: ", ""))["conversationId"]

    # 4. Open old chat (verify the user's reported bug is FIXED!)
    conv_detail_resp = await client.get(f"/api/chat/conversations/{conv_id}", headers=headers)
    assert conv_detail_resp.status_code == 200
    conv_data = conv_detail_resp.json()
    assert conv_data["success"] is True
    assert conv_data["conversation"]["id"] == conv_id
    assert len(conv_data["conversation"]["messages"]) >= 2  # user + assistant

    # 5. Rename conversation
    rename_resp = await client.patch(
        f"/api/chat/conversations/{conv_id}",
        json={"title": "Updated Math Chat"},
        headers=headers
    )
    assert rename_resp.status_code == 200
    assert rename_resp.json()["title"] == "Updated Math Chat"

    # 6. Delete conversation
    del_resp = await client.delete(f"/api/chat/conversations/{conv_id}", headers=headers)
    assert del_resp.status_code == 200
