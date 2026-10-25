from pydantic import BaseModel


class AddDependency(BaseModel):
    depends_on_task_id: int


class DependencyOut(BaseModel):
    id: int
    task_id: int
    depends_on_task_id: int

    class Config:
        from_attributes = True