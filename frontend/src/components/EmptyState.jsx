import Icon from "./Icon";

// A friendly message when there is nothing to show.
// action is optional: a button (or anything else) shown below the text.
export default function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name={icon} size={22} />
      </div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-text">{text}</p>
      {action}
    </div>
  );
}
