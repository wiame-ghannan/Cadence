import pytest


@pytest.mark.asyncio
async def test_register_user_success(client):
    response = await client.post("/users", json={
        "email": "alice@example.com",
        "password": "password123",
        "name": "Alice",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert "password" not in data  # le mot de passe ne doit jamais être exposé


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/users", json={
        "email": "bob@example.com",
        "password": "password123",
        "name": "Bob",
    })

    response = await client.post("/token", data={
        "username": "bob@example.com",
        "password": "password123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/users", json={
        "email": "charlie@example.com",
        "password": "password123",
        "name": "Charlie",
    })

    response = await client.post("/token", data={
        "username": "charlie@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401