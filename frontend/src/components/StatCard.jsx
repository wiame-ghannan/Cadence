import Icon from "./Icon";

// One number in the project header, for example "Total duration: 12 days".
// critical colors the number in red (only for critical tasks).
export default function StatCard({ icon, label, value, critical = false }) {
  return (
    <div className="stat-card">
      <span className={critical ? "stat-icon stat-icon-critical" : "stat-icon"}>
        <Icon name={icon} />
      </span>
      <div>
        <p className="stat-label">{label}</p>
        <p className={critical ? "stat-value stat-value-critical" : "stat-value"}>{value}</p>
      </div>
    </div>
  );
}
