import TaskColumn from "./TaskColumn";
import { STATUSES } from "../labels";

// The 3 columns: To do, In progress, Done
export default function TaskBoard({ tasks, plan, prerequisites, members, user, onOpen, onStatusChange }) {
  return (
    <div className="board">
      {STATUSES.map((status) => (
        <TaskColumn
          key={status}
          status={status}
          // Oldest tasks first, so cards do not jump around
          tasks={tasks.filter((task) => task.status === status).sort((a, b) => a.id - b.id)}
          allTasks={tasks}
          plan={plan}
          prerequisites={prerequisites}
          members={members}
          user={user}
          onOpen={onOpen}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
