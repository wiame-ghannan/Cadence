import { formatDays, dayRange } from "../labels";

// Turns a number of days into a position on the track, in percent
function percent(days, total) {
  return `${(Math.max(0, days) / total) * 100}%`;
}

// One task of the timeline: its label on the left, its bar on the right.
// The bar goes from earliest_start to earliest_finish; the slack is drawn
// with a dashed outline right after it.
export default function TimelineRow({ task, position, plan, total, ticks, onOpen }) {
  // Keys of the plan dictionaries are text
  const key = String(task.id);
  const start = plan.earliest_start[key];
  const finish = plan.earliest_finish[key];
  const slack = plan.slack[key];
  const isCritical = plan.critical_tasks.includes(task.id);

  // Shown on hover, with days counted from 1
  const details =
    `${task.title}: ${dayRange(start, finish)}` +
    ` (at the latest ${dayRange(plan.latest_start[key], plan.latest_finish[key])},` +
    ` slack ${formatDays(slack)})`;

  return (
    <div className="timeline-row">
      <button className="timeline-label" onClick={() => onOpen(task)} title={details}>
        <span className="timeline-step">{position}</span>
        <span className="timeline-title">{task.title}</span>
        <span className="timeline-dates">
          {/* Positions start at 0: the task runs from day start + 1 to day finish */}
          {`Day ${start + 1} - ${finish} · `}
          {isCritical ? "Critical" : `Slack ${formatDays(slack)}`}
        </span>
      </button>

      <div className="timeline-track">
        {/* Light vertical lines, where each day column starts */}
        {ticks.map((position) => (
          <span key={position} className="timeline-gridline" style={{ left: percent(position, total) }} />
        ))}

        <div
          className={isCritical ? "timeline-bar is-critical" : "timeline-bar"}
          style={{ left: percent(start, total), width: percent(finish - start, total) }}
          title={details}
        >
          <span className="timeline-bar-label">{formatDays(task.duration)}</span>
        </div>

        {slack > 0 && (
          <div
            className="timeline-slack"
            style={{ left: percent(finish, total), width: percent(slack, total) }}
            title={`Slack: ${formatDays(slack)}`}
          />
        )}
      </div>
    </div>
  );
}
