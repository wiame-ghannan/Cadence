import { PRIORITY_LABELS } from "../labels";

// Colored label for low, medium or high priority
export default function PriorityBadge({ priority }) {
  return (
    <span className={`badge badge-priority-${priority}`}>{PRIORITY_LABELS[priority]}</span>
  );
}
