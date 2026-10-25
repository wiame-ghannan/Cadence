from pydantic import BaseModel


class ScheduleOut(BaseModel):
    order: list[int]


class CriticalPathOut(BaseModel):
    total_duration: int
    critical_tasks: list[int]
    earliest_start: dict[int, int]
    earliest_finish: dict[int, int]
    latest_start: dict[int, int]
    latest_finish: dict[int, int]
    slack: dict[int, int]