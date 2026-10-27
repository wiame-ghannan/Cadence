import { useState } from "react";
import { createProject, updateProject } from "../api";
import Modal from "./Modal";
import ErrorMessage from "./ErrorMessage";

// Modal to create a project, or to edit one when "project" is given.
// onSaved is called with the saved project, onClose when the user cancels.
export default function ProjectModal({ token, project, onSaved, onClose }) {
  const isEdit = Boolean(project);
  const [name, setName] = useState(isEdit ? project.name : "");
  const [description, setDescription] = useState(isEdit ? project.description || "" : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      let saved;
      if (isEdit) {
        // An emptied description is sent as null, which clears it
        saved = await updateProject(token, project.id, {
          name: name.trim(),
          description: description.trim() || null,
        });
      } else {
        saved = await createProject(token, {
          name: name.trim(),
          description: description.trim() || null,
        });
      }
      onSaved(saved);
    } catch (err) {
      setError(err.status === 403 ? "Only the project owner can edit it." : err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit project" : "New project"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <label className="field">
            <span className="field-label">Name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Website launch"
              autoFocus
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Description</span>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goal, scope, deadline…"
            />
            <span className="field-hint">Optional</span>
          </label>

          <ErrorMessage message={error} />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
