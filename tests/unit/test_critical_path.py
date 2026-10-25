from app.services.critical_path import calculate_critical_path
from app.services.topological_sort import topological_sort

ORDER = [1, 2, 3, 4, 5, 6, 7, 8]


def test_total_duration(project_adj, project_duration):
    result = calculate_critical_path(project_adj, project_duration, ORDER)

    assert result["total_duration"] == 16


def test_critical_tasks(project_adj, project_duration):
    result = calculate_critical_path(project_adj, project_duration, ORDER)

    assert result["critical_tasks"] == [1, 3, 5, 7, 8]


def test_slack_of_every_task(project_adj, project_duration):
    result = calculate_critical_path(project_adj, project_duration, ORDER)

    assert result["slack"] == {1: 0, 2: 4, 3: 0, 4: 3, 5: 0, 6: 2, 7: 0, 8: 0}


def test_earliest_and_latest_dates(project_adj, project_duration):
    result = calculate_critical_path(project_adj, project_duration, ORDER)

    # Permission checks wait for the CRUD, which ends on day 6
    assert result["earliest_start"][4] == 6
    # Deployment waits for the integration tests, which end on day 14
    assert result["earliest_start"][8] == 14
    # Authentication API can start as late as day 6 without delaying anything
    assert result["latest_start"][2] == 6
    # Frontend board can start as late as day 8
    assert result["latest_start"][6] == 8


def test_critical_tasks_form_a_chain(project_adj, project_duration):
    result = calculate_critical_path(project_adj, project_duration, ORDER)
    critical = result["critical_tasks"]

    # Each critical task is directly followed by the next critical task
    for current, following in zip(critical, critical[1:]):
        assert following in project_adj[current]


def test_delaying_a_critical_task_delays_the_project(project_adj, project_duration):
    # The graph engine takes one more day
    project_duration[5] += 1

    result = calculate_critical_path(project_adj, project_duration, ORDER)

    assert result["total_duration"] == 17


def test_delaying_a_task_within_its_slack_changes_nothing(project_adj, project_duration):
    # The frontend has 2 days of slack, so 2 more days is absorbed
    project_duration[6] += 2

    result = calculate_critical_path(project_adj, project_duration, ORDER)

    assert result["total_duration"] == 16


def test_delaying_a_task_beyond_its_slack_delays_the_project(project_adj, project_duration):
    # 3 days is more than the 2 days of slack: the frontend becomes critical
    project_duration[6] += 3

    result = calculate_critical_path(project_adj, project_duration, ORDER)

    assert result["total_duration"] == 17
    assert 6 in result["critical_tasks"]


def test_isolated_task_has_large_slack(project_adj, project_indegree, project_duration):
    # Documentation (2 days) has no dependency, so it can happen at any time
    project_adj[9] = []
    project_indegree[9] = 0
    project_duration[9] = 2

    order = topological_sort(project_adj, project_indegree)
    result = calculate_critical_path(project_adj, project_duration, order)

    assert result["total_duration"] == 16
    assert result["slack"][9] == 14
    assert 9 not in result["critical_tasks"]


def test_single_task_is_critical():
    result = calculate_critical_path({1: []}, {1: 7}, [1])

    assert result["total_duration"] == 7
    assert result["critical_tasks"] == [1]
    assert result["slack"] == {1: 0}


def test_empty_project():
    result = calculate_critical_path({}, {}, [])

    assert result["total_duration"] == 0
    assert result["critical_tasks"] == []


def test_sort_then_critical_path_together(project_adj, project_indegree, project_duration):
    # Same flow as the endpoint: topological sort first, then critical path
    order = topological_sort(project_adj, project_indegree)
    result = calculate_critical_path(project_adj, project_duration, order)

    assert result["total_duration"] == 16
    assert set(result["critical_tasks"]) == {1, 3, 5, 7, 8}