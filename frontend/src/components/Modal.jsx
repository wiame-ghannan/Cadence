import { useEffect } from "react";
import Icon from "./Icon";

// A window shown above the page. onClose is called by the X button,
// by a click on the dark background, or by the Escape key.
// wide makes the window larger (used by the task form).
export default function Modal({ title, onClose, wide = false, children }) {
  // Listen to the Escape key while the modal is open
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    // Stop listening when the modal closes
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Clicks inside the card must not close the modal */}
      <div
        className={wide ? "modal modal-wide" : "modal"}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
