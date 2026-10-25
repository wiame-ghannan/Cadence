from collections import deque


class CycleDetectedError(Exception):
    def __init__(self, cycle):
        self.cycle = cycle
        super().__init__(f"Dependency cycle detected: {cycle}")


def topological_sort(adj, indegree):
    # Work on a copy so the original indegree is not modified
    indegree = dict(indegree)

    # Start with every task that has no prerequisite
    queue = deque()
    for task in indegree:
        if indegree[task] == 0:
            queue.append(task)

    order = []

    while queue:
        task = queue.popleft()
        order.append(task)

        for nxt in adj[task]:
            indegree[nxt] -= 1
            # A task is ready once all its prerequisites are done
            if indegree[nxt] == 0:
                queue.append(nxt)

    # Tasks stuck in a cycle never reach indegree 0, so they are missing from order
    if len(order) != len(adj):
        raise CycleDetectedError(find_cycle(adj))

    return order


def find_cycle(adj):
    UNVISITED, VISITING, VISITED = 0, 1, 2

    state = {}
    for task in adj:
        state[task] = UNVISITED

    path = []  # tasks on the current DFS path

    def dfs(node):
        state[node] = VISITING
        path.append(node)

        for nxt in adj[node]:
            # Reaching a task still on the current path means we looped back
            if state[nxt] == VISITING:
                start = path.index(nxt)
                return path[start:] + [nxt]
            if state[nxt] == UNVISITED:
                found = dfs(nxt)
                if found:
                    return found

        path.pop()
        state[node] = VISITED
        return None

    for task in adj:
        if state[task] == UNVISITED:
            found = dfs(task)
            if found:
                return found

    return None