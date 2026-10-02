import pytest
import io

@pytest.mark.asyncio
async def test_file_upload_list_and_delete(client):
    # 1. Login
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": "demo@akashagent.dev", "password": "demo123"}
    )
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload text file
    file_content = b"This is a test document containing important knowledge for RAG retrieval."
    files = {"file": ("knowledge.txt", io.BytesIO(file_content), "text/plain")}

    upload_resp = await client.post("/api/files/upload", files=files, headers=headers)
    assert upload_resp.status_code == 201
    upload_data = upload_resp.json()
    assert upload_data["success"] is True
    file_id = upload_data["file"]["id"]
    assert upload_data["file"]["name"] == "knowledge.txt"

    # 3. List files
    list_resp = await client.get("/api/files", headers=headers)
    assert list_resp.status_code == 200
    files_list = list_resp.json()["files"]
    assert any(f["id"] == file_id for f in files_list)

    # 4. Delete file
    del_resp = await client.delete(f"/api/files/{file_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True
