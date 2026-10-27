import Icon from "./Icon";

// Small notifications in the bottom right corner.
// toasts is [{id, type: "success" | "error", message}], onDismiss removes one.
export default function ToastList({ toasts, onDismiss }) {
  return (
    <div className="toast-list" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
          <span className="toast-icon">
            <Icon name={toast.type === "success" ? "check" : "alert"} />
          </span>
          <p className="toast-message">{toast.message}</p>
          <button
            className="icon-button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
