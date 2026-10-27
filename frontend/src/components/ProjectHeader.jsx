import Icon from "./Icon";
import StatCard from "./StatCard";
import { formatDays } from "../labels";

// Top of a project: name, description, actions, the 3 numbers and the view switch.
// plan is the critical path result, or null when it cannot be computed.
export default function ProjectHeader({
  project,
  isOwner,
  plan,
  taskCount,
  memberCount,
  view,
  onViewChange,
  onNewTask,
  onMembers,
  onEditProject,
  onDeleteProject,
}) {
  return (
    <header className="project-header">
      <div className="project-header-top">
        <div className="project-heading">
          <div className="project-title-row">
            <h1 className="project-title">{project.name}</h1>
            <span className="badge badge-neutral">{isOwner ? "Owner" : "Member"}</span>
          </div>
          {project.description && <p className="project-description">{project.description}</p>}
        </div>

        <div className="project-actions">
          <button className="btn btn-secondary" onClick={onMembers}>
            <Icon name="users" />
            Members
            <span className="count">{memberCount}</span>
          </button>

          {/* Owner-only actions are hidden for simple members */}
          {isOwner && (
            <>
              <button className="icon-button" onClick={onEditProject} title="Edit project" aria-label="Edit project">
                <Icon name="edit" />
              </button>
              <button className="icon-button" onClick={onDeleteProject} title="Delete project" aria-label="Delete project">
                <Icon name="trash" />
              </button>
              <button className="btn btn-primary" onClick={onNewTask}>
                <Icon name="plus" />
                New task
              </button>
            </>
          )}
        </div>
      </div>

      <div className="stats">
        <StatCard
          icon="clock"
          label="Total duration"
          value={plan ? formatDays(plan.total_duration) : "—"}
        />
        <StatCard icon="board" label="Tasks" value={taskCount} />
        <StatCard
          icon="flag"
          label="Critical tasks"
          value={plan ? plan.critical_tasks.length : "—"}
          critical
        />
      </div>

      <div className="view-switch" role="tablist" aria-label="View">
        <button
          role="tab"
          aria-selected={view === "board"}
          className={view === "board" ? "view-switch-button is-active" : "view-switch-button"}
          onClick={() => onViewChange("board")}
        >
          <Icon name="board" />
          Board
        </button>
        <button
          role="tab"
          aria-selected={view === "timeline"}
          className={view === "timeline" ? "view-switch-button is-active" : "view-switch-button"}
          onClick={() => onViewChange("timeline")}
        >
          <Icon name="timeline" />
          Timeline
        </button>
      </div>
    </header>
  );
}
