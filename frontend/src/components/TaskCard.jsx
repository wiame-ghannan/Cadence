import Icon from "./Icon";
import PriorityBadge from "./PriorityBadge";
import { STATUSES, STATUS_LABELS, formatDays, memberName } from "../labels";

// One task on the board.
// isCritical shows the red "Critical" badge, otherwise slack (in days) is shown.
// waitingFor lists the prerequisites that are not done: the task cannot start yet.
export default function TaskCard({ task, isCritical, slack, prerequisiteCount, waitingFor, members, user, onOpen, onStatusChange }) {
  const isBlocked = waitingFor.length > 0;
  const waitingText = `Waiting for: ${waitingFor.map((t) => t.title).join(", ")}`;

  return (
    <article className={isCritical ? "task-card is-critical" : "task-card"}>
      {/* The whole title area opens the task */}
      <button className="task-card-main" onClick={() => onOpen(task)}>
        <p className="task-title">{task.title}</p>

        <div className="task-badges">
          <PriorityBadge priority={task.priority} />
          {isCritical && <span className="badge badge-critical">Critical</span>}
          {!isCritical && slack !== undefined && (
            <span className="badge badge-neutral">Slack {formatDays(slack)}</span>
          )}
          {isBlocked && (
            <span className="badge badge-neutral" title={waitingText}>
              <Icon name="link" size={12} /> Blocked
            </span>
          )}
        </div>

        <div className="task-meta">
          <span className="task-meta-item">
            <Icon name="clock" size={14} />
            {formatDays(task.duration)}
          </span>
          {prerequisiteCount > 0 && (
            <span className="task-meta-item">
              <Icon name="link" size={14} />
              {prerequisiteCount} prerequisite{prerequisiteCount > 1 ? "s" : ""}
            </span>
          )}
          {task.assigned_to !== null && (
            <span className="task-meta-item">
              <Icon name="user" size={14} />
              {memberName(task.assigned_to, members, user)}
            </span>
          )}
        </div>
      </button>

      {/* Status change: a simple menu, no drag and drop */}
      <select
        className="input input-small"
        value={task.status}
        onChange={(e) => onStatusChange(task, e.target.value)}
        aria-label={`Status of ${task.title}`}
      >
        {STATUSES.map((status) => (
          // While blocked, the task can only stay where it is or go back to "To do"
          <option
            key={status}
            value={status}
            disabled={isBlocked && status !== "todo" && status !== task.status}
          >
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </article>
  );
}
