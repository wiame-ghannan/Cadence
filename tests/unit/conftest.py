import pytest
import pytest_asyncio


# Override the global fixture: unit tests do not need the database
@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    yield


# Realistic software project used by the engine tests:
# 1 Database schema (2d)
# 2 Authentication API (3d), after 1
# 3 Project and task CRUD (4d), after 1
# 4 Permission checks (2d), after 2 and 3
# 5 Graph engine (5d), after 3
# 6 Frontend board (6d), after 3
# 7 Integration tests (3d), after 4 and 5
# 8 Deployment (2d), after 6 and 7
# Each fixture returns a fresh dict, so a test can modify it freely.
@pytest.fixture
def project_duration():
    return {1: 2, 2: 3, 3: 4, 4: 2, 5: 5, 6: 6, 7: 3, 8: 2}


@pytest.fixture
def project_adj():
    return {1: [2, 3], 2: [4], 3: [4, 5, 6], 4: [7], 5: [7], 6: [8], 7: [8], 8: []}


@pytest.fixture
def project_indegree():
    return {1: 0, 2: 1, 3: 1, 4: 2, 5: 1, 6: 1, 7: 2, 8: 2}