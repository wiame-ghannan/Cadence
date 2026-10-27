import { useState } from "react";
import Modal from "./Modal";

// Asks "are you sure?" before a destructive action.
// onConfirm is an async function: the button waits for it to finish.
export default function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }) {
  const [working, setWorking] = useState(false);

  async function handleConfirm() {
    setWorking(true);
    await onConfirm();
    setWorking(false);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="modal-body">
        <p className="text-muted">{message}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-strong" onClick={handleConfirm} disabled={working}>
          {working ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
