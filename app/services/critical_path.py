def forward_pass(adj, duration, order):
    earliest_start = {}
    earliest_finish = {}

    # Every task starts at 0 until a prerequisite pushes it later
    for task in order:
        earliest_start[task] = 0

    # Follow the topological order: prerequisites are always processed first
    for task in order:
        earliest_finish[task] = earliest_start[task] + duration[task]

        for nxt in adj[task]:
            # A task starts when its slowest prerequisite is finished
            if earliest_finish[task] > earliest_start[nxt]:
                earliest_start[nxt] = earliest_finish[task]

    return earliest_start, earliest_finish


def backward_pass(adj, duration, order, total):
    latest_start = {}
    latest_finish = {}

    # Follow the topological order in reverse: successors are processed first
    for task in reversed(order):
        if len(adj[task]) == 0:
            # Last task: it must finish by the end of the project
            finish = total
        else:
            # Must finish before the most urgent successor starts
            finish = None
            for nxt in adj[task]:
                if finish is None or latest_start[nxt] < finish:
                    finish = latest_start[nxt]

        latest_finish[task] = finish
        latest_start[task] = finish - duration[task]

    return latest_start, latest_finish


def calculate_critical_path(adj, duration, order):
    earliest_start, earliest_finish = forward_pass(adj, duration, order)

    # Project duration is the latest earliest-finish (0 if the project has no task)
    total = max(earliest_finish.values(), default=0)

    latest_start, latest_finish = backward_pass(adj, duration, order, total)

    slack = {}
    critical = []
    for task in order:
        slack[task] = latest_start[task] - earliest_start[task]
        # Zero slack means any delay delays the whole project
        if slack[task] == 0:
            critical.append(task)

    return {
        "total_duration": total,
        "earliest_start": earliest_start,
        "earliest_finish": earliest_finish,
        "latest_start": latest_start,
        "latest_finish": latest_finish,
        "slack": slack,
        "critical_tasks": critical,
    }