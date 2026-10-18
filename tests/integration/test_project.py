import pytest


async def register_and_login(client, email: str, password: str, name: str) -> dict:
    await client.post("/users", json={"email": email, "password": password, "name": name})
    token_response = await client.post("/token", data={"username": email, "password": password})
    token = token_response.json()["access_token"]

    me_response = await client.get("/users/me/", headers={"Authorization": f"Bearer {token}"})
    user_id = me_response.json()["id"]

    return {"token": token, "id": user_id}


@pytest.mark.asyncio
async def test_create_project_makes_creator_owner(client):
    alice = await register_and_login(client, "alice@example.com", "password123", "Alice")

    response = await client.post(
        "/project",
        json={"name": "Projet Alice", "description": "desc"},
        headers={"Authorization": f"Bearer {alice['token']}"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Projet Alice"


@pytest.mark.asyncio
async def test_non_member_cannot_view_project(client):
    alice = await register_and_login(client, "alice2@example.com", "password123", "Alice")
    bob = await register_and_login(client, "bob@example.com", "password456", "Bob")

    project_response = await client.post(
        "/project",
        json={"name": "Projet privé", "description": "desc"},
        headers={"Authorization": f"Bearer {alice['token']}"},
    )
    project_id = project_response.json()["id"]

    response = await client.get(
        f"/project/{project_id}",
        headers={"Authorization": f"Bearer {bob['token']}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_non_owner_cannot_update_project(client):
    alice = await register_and_login(client, "alice3@example.com", "password123", "Alice")
    bob = await register_and_login(client, "bob2@example.com", "password456", "Bob")

    project_response = await client.post(
        "/project",
        json={"name": "Projet Alice", "description": "desc"},
        headers={"Authorization": f"Bearer {alice['token']}"},
    )
    project_id = project_response.json()["id"]

    await client.post(
        f"/projects/{project_id}/members",
        json={"user_id": bob["id"], "role": "member"},
        headers={"Authorization": f"Bearer {alice['token']}"},
    )

    response = await client.patch(
        f"/project/{project_id}",
        json={"name": "Nouveau nom"},
        headers={"Authorization": f"Bearer {bob['token']}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_member_can_view_project_after_being_added(client):
    alice = await register_and_login(client, "alice4@example.com", "password123", "Alice")
    bob = await register_and_login(client, "bob3@example.com", "password456", "Bob")

    project_response = await client.post(
        "/project",
        json={"name": "Projet Alice", "description": "desc"},
        headers={"Authorization": f"Bearer {alice['token']}"},
    )
    project_id = project_response.json()["id"]

    await client.post(
        f"/projects/{project_id}/members",
        json={"user_id": bob["id"], "role": "member"},
        headers={"Authorization": f"Bearer {alice['token']}"},
    )

    response = await client.get(
        f"/project/{project_id}",
        headers={"Authorization": f"Bearer {bob['token']}"},
    )
    assert response.status_code == 200