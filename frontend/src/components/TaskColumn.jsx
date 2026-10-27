import TaskCard from "./TaskCard";
import { STATUS_LABELS, unfinishedTasks } from "../labels";

// One column of the board, with its counter and its cards.
// allTasks is every task of the project, used to know which prerequisites are done.
export default function TaskColumn({ status, tasks, allTasks, plan, prerequisites, members, user, onOpen, onStatusChange }) {
  return (
    <section className="column" aria-label={STATUS_LABELS[status]}>
      <div className="column-header">
        <span className={`status-dot status-dot-${status}`} />
        <h2 className="column-title">{STATUS_LABELS[status]}</h2>
        <span className="count">{tasks.length}</span>
      </div>

      <div className="column-cards">
        {tasks.length === 0 && <p className="column-empty">No tasks</p>}

        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            // Keys of the plan dictionaries are text, so we use String(task.id)
            isCritical={plan ? plan.critical_tasks.includes(task.id) : false}
            slack={plan ? plan.slack[String(task.id)] : undefined}
            prerequisiteCount={(prerequisites[task.id] || []).length}
            waitingFor={unfinishedTasks(prerequisites[task.id] || [], allTasks)}
            members={members}
            user={user}
            onOpen={onOpen}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </section>
  );
}
