from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.graph_service import build_graph
from app.services.topological_sort import topological_sort, CycleDetectedError
from app.services.critical_path import calculate_critical_path
from app.services.project_service import check_is_member


async def _get_order(db: AsyncSession, project_id: int):
    adj, indegree, duration = await build_graph(db, project_id)
    try:
        order = topological_sort(adj, indegree)
    except CycleDetectedError as e:
        # Tell the user which tasks block each other
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Dependency cycle detected", "cycle": e.cycle},
        )
    return adj, duration, order


async def get_schedule(db: AsyncSession, project_id: int, current_user_id: int):
    await check_is_member(db, project_id, current_user_id)
    adj, duration, order = await _get_order(db, project_id)
    return {"order": order}


async def get_critical_path(db: AsyncSession, project_id: int, current_user_id: int):
    await check_is_member(db, project_id, current_user_id)
    adj, duration, order = await _get_order(db, project_id)
    return calculate_critical_path(adj, duration, order)