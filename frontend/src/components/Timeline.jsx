import TimelineRow from "./TimelineRow";
import EmptyState from "./EmptyState";
import { formatDays } from "../labels";

// The planning view: one row per task, in execution order,
// with a bar from earliest_start to earliest_finish.
export default function Timeline({ tasks, plan, order, onOpen }) {
  // No plan when the dependencies form a cycle (the alert is shown above)
  if (!plan) {
    return (
      <EmptyState
        icon="timeline"
        title="No timeline available"
        text="The plan cannot be computed while the dependencies form a cycle."
      />
    );
  }

  // Avoid dividing by 0 if every task lasts 0 days
  const total = plan.total_duration > 0 ? plan.total_duration : 1;

  // One column per day. Position 0 is the start of Day 1, so column i shows Day i + 1.
  const ticks = [];
  for (let position = 0; position < plan.total_duration; position += 1) {
    ticks.push(position);
  }

  // Tasks in the order given by /schedule
  const rows = order.map((id) => tasks.find((task) => task.id === id)).filter(Boolean);
  const criticalTitles = rows
    .filter((task) => plan.critical_tasks.includes(task.id))
    .map((task) => task.title);

  return (
    <div className="timeline">
      <div className="timeline-summary">
        <p>
          <span className="text-muted">Critical path: </span>
          <strong className="text-critical">{criticalTitles.join(" → ")}</strong>
        </p>
        <div className="timeline-legend">
          <span className="legend-item">
            <span className="legend-swatch legend-critical" /> Critical
          </span>
          <span className="legend-item">
            <span className="legend-swatch legend-normal" /> Normal
          </span>
          <span className="legend-item">
            <span className="legend-swatch legend-slack" /> Slack
          </span>
          <span className="text-muted">Total: {formatDays(plan.total_duration)}</span>
        </div>
      </div>

      {/* On small screens the chart scrolls sideways inside this box */}
      <div className="timeline-scroll">
        <div className="timeline-grid">
          <div className="timeline-row timeline-head">
            <div className="timeline-label-head">Task, in execution order</div>
            <div className="timeline-axis">
              {ticks.map((position) => (
                <span
                  key={position}
                  className="timeline-tick"
                  style={{ left: `${(position / total) * 100}%`, width: `${(1 / total) * 100}%` }}
                >
                  Day {position + 1}
                </span>
              ))}
            </div>
          </div>

          {rows.map((task, index) => (
            <TimelineRow
              key={task.id}
              task={task}
              position={index + 1}
              plan={plan}
              total={total}
              ticks={ticks}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
