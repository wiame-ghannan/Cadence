import pytest
from app.services.topological_sort import topological_sort, CycleDetectedError


def test_order_respects_every_dependency(project_adj, project_indegree):
    order = topological_sort(project_adj, project_indegree)

    # A prerequisite must always come before the task that waits for it
    for task, successors in project_adj.items():
        for nxt in successors:
            assert order.index(task) < order.index(nxt)


def test_order_contains_every_task(project_adj, project_indegree):
    order = topological_sort(project_adj, project_indegree)

    assert sorted(order) == [1, 2, 3, 4, 5, 6, 7, 8]


def test_isolated_task_is_included(project_adj, project_indegree):
    # Task 9 (documentation) has no dependency and nobody waits for it
    project_adj[9] = []
    project_indegree[9] = 0

    order = topological_sort(project_adj, project_indegree)

    assert 9 in order
    assert len(order) == 9


def test_empty_project_returns_empty_order():
    assert topological_sort({}, {}) == []


def test_full_cycle_raises_error_with_the_cycle(project_adj, project_indegree):
    # The database schema now waits for the deployment: the whole project is blocked
    project_adj[8].append(1)
    project_indegree[1] += 1

    with pytest.raises(CycleDetectedError) as error:
        topological_sort(project_adj, project_indegree)

    assert error.value.cycle == [1, 2, 4, 7, 8, 1]


def test_partial_cycle_is_detected(project_adj, project_indegree):
    # Frontend (6) and deployment (8) wait for each other, the rest is fine
    project_adj[8].append(6)
    project_indegree[6] += 1

    with pytest.raises(CycleDetectedError) as error:
        topological_sort(project_adj, project_indegree)

    assert error.value.cycle == [8, 6, 8]


def test_original_indegree_is_not_modified(project_adj, project_indegree):
    before = dict(project_indegree)

    topological_sort(project_adj, project_indegree)

    assert project_indegree == before