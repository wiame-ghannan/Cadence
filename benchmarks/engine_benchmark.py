import random
import time

from app.services.topological_sort import topological_sort
from app.services.critical_path import calculate_critical_path


def make_project(n, max_prerequisites=3):
    adj = {i: [] for i in range(1, n + 1)}
    indegree = {i: 0 for i in range(1, n + 1)}
    duration = {i: random.randint(1, 10) for i in range(1, n + 1)}

    for task in range(2, n + 1):
        count = random.randint(0, min(max_prerequisites, task - 1))
        for prerequisite in random.sample(range(1, task), count):
            adj[prerequisite].append(task)
            indegree[task] += 1

    return adj, indegree, duration


def measure(n, runs=5):
    adj, indegree, duration = make_project(n)
    edges = sum(len(successors) for successors in adj.values())

    times = []
    for _ in range(runs):
        start = time.perf_counter()
        order = topological_sort(adj, indegree)
        calculate_critical_path(adj, duration, order)
        times.append((time.perf_counter() - start) * 1000)

    return edges, min(times), sum(times) / len(times)


if __name__ == "__main__":
    random.seed(42)

    print(f"{'tasks':>8} {'dependencies':>13} {'best (ms)':>10} {'average (ms)':>13}")
    for n in [100, 1_000, 10_000, 100_000]:
        edges, best, average = measure(n)
        print(f"{n:>8} {edges:>13} {best:>10.1f} {average:>13.1f}")