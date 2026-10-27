import { useState } from "react";
import { createTask, updateTask, addDependency, removeDependency } from "../api";
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS, formatDays, memberName, unfinishedTasks } from "../labels";
import Modal from "./Modal";
import ErrorMessage from "./ErrorMessage";
import CycleAlert from "./CycleAlert";
import Icon from "./Icon";

// Modal to create a task, or to edit one when "task" is given.
// - onSaved(message): the task was saved
// - onConflict(error): 409, someone else changed the task in the meantime
// - onDependenciesChanged(): some prerequisites were saved, the parent reloads
// - onDelete(): the owner clicked "Delete"
export default function TaskModal({
  token,
  projectId,
  task,
  tasks,
  prerequisites,
  members,
  user,
  isOwner,
  onSaved,
  onConflict,
  onDependenciesChanged,
  onDelete,
  onClose,
}) {
  const isEdit = Boolean(task);
  const initialPrerequisites = isEdit ? prerequisites[task.id] || [] : [];

  const [title, setTitle] = useState(isEdit ? task.title : "");
  const [description, setDescription] = useState(isEdit ? task.description || "" : "");
  const [priority, setPriority] = useState(isEdit ? task.priority : "medium");
  const [duration, setDuration] = useState(isEdit ? String(task.duration) : "1");
  const [status, setStatus] = useState(isEdit ? task.status : "todo");
  // "" means nobody; select values are text, so ids are stored as text
  const [assignedTo, setAssignedTo] = useState(
    isEdit && task.assigned_to !== null ? String(task.assigned_to) : ""
  );
  // Prerequisites checked in the form
  const [checked, setChecked] = useState(initialPrerequisites);
  // Prerequisites really saved in the API (updated one by one while saving)
  const [savedPrerequisites, setSavedPrerequisites] = useState(initialPrerequisites);

  const [error, setError] = useState("");
  const [cycle, setCycle] = useState(null);
  const [saving, setSaving] = useState(false);

  // A task can wait for any other task of the project
  const candidates = tasks.filter((t) => !isEdit || t.id !== task.id).sort((a, b) => a.id - b.id);

  // Only members of the project can be assigned
  const assigneeIds = members.map((member) => member.user_id);

  // Same rules as the API:
  // - the task cannot start while a checked prerequisite is not done
  // - a task that has started cannot get a new prerequisite that is not done
  const waitingFor = unfinishedTasks(checked, tasks);
  const hasStarted = isEdit && task.status !== "todo";

  function togglePrerequisite(id) {
    if (checked.includes(id)) {
      setChecked(checked.filter((x) => x !== id));
    } else {
      setChecked([...checked, id]);
    }
  }

  // Edit mode: add and remove dependencies one by one.
  // They are saved before the task itself, so a cycle stops everything
  // before the task is changed.
  async function saveDependencies() {
    let saved = savedPrerequisites;
    const toRemove = saved.filter((id) => !checked.includes(id));
    const toAdd = checked.filter((id) => !saved.includes(id));

    try {
      for (const id of toRemove) {
        await removeDependency(token, task.id, id);
        saved = saved.filter((x) => x !== id);
      }
      for (const id of toAdd) {
        await addDependency(token, task.id, id);
        saved = [...saved, id];
      }
    } finally {
      // Remember what is really saved, so a second try only sends the rest
      setSavedPrerequisites(saved);
      if (toRemove.length + toAdd.length > 0) onDependenciesChanged();
    }
  }

  // Edit mode: only the fields that changed, plus the mandatory version
  function buildChanges(days) {
    const changes = { version: task.version };
    if (title.trim() !== task.title) changes.title = title.trim();
    // An emptied description is sent as null, which clears it
    if (description.trim() !== (task.description || "")) changes.description = description.trim() || null;
    if (priority !== task.priority) changes.priority = priority;
    if (days !== task.duration) changes.duration = days;
    if (status !== task.status) changes.status = status;
    // "" means nobody: sent as null, which removes the assignee
    const newAssignee = assignedTo === "" ? null : Number(assignedTo);
    if (newAssignee !== task.assigned_to) changes.assigned_to = newAssignee;
    return changes;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setCycle(null);

    // Same rule as the API (at least 1 day), checked here for a clearer message
    const days = Number(duration);
    if (!Number.isInteger(days) || days < 1) {
      setError("The duration must be a whole number of days, at least 1.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        if (isOwner) await saveDependencies();
        const changes = buildChanges(days);
        // Only "version" means nothing changed: no need to call the API
        if (Object.keys(changes).length > 1) {
          await updateTask(token, task.id, changes);
        }
        onSaved(`"${title.trim()}" saved.`);
      } else {
        await createTask(token, projectId, {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          duration: days,
          assigned_to: assignedTo === "" ? null : Number(assignedTo),
          depends_on: checked,
        });
        onSaved(`"${title.trim()}" created.`);
      }
    } catch (err) {
      setSaving(false);
      if (err.status === 409) {
        onConflict(err);
      } else if (err.status === 400 && err.detail && err.detail.cycle) {
        setCycle(err.detail);
      } else {
        setError(err.message);
      }
    }
  }

  return (
    <Modal title={isEdit ? "Edit task" : "New task"} onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <label className="field">
            <span className="field-label">Title</span>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Design the homepage"
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
              placeholder="Details, links, acceptance criteria…"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field-label">Priority</span>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Duration (days)</span>
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </label>

            {/* A new task always starts in "To do" */}
            {isEdit && (
              <label className="field">
                <span className="field-label">Status</span>
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => (
                    <option
                      key={s}
                      value={s}
                      disabled={waitingFor.length > 0 && s !== "todo" && s !== task.status}
                    >
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                {waitingFor.length > 0 && (
                  <span className="field-hint">
                    Waiting for: {waitingFor.map((t) => t.title).join(", ")}
                  </span>
                )}
              </label>
            )}
          </div>

          <label className="field">
            <span className="field-label">Assignee</span>
            <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Nobody</option>
              {assigneeIds.map((id) => (
                <option key={id} value={String(id)}>
                  {memberName(id, members, user)}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="field prerequisites" disabled={!isOwner}>
            <legend className="field-label">Prerequisites</legend>
            <span className="field-hint">
              {isOwner
                ? "This task can only start when the checked tasks are finished."
                : "Only the project owner can change prerequisites."}
            </span>

            {candidates.length === 0 && <p className="field-hint">No other task in this project yet.</p>}

            {candidates.length > 0 && (
              <div className="checkbox-list">
                {candidates.map((t) => (
                  <label key={t.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={checked.includes(t.id)}
                      onChange={() => togglePrerequisite(t.id)}
                      // A started task can only get prerequisites that are already done
                      disabled={hasStarted && t.status !== "done" && !savedPrerequisites.includes(t.id)}
                    />
                    <span className="checkbox-title">{t.title}</span>
                    <span className="checkbox-meta">{formatDays(t.duration)}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          {cycle && <CycleAlert message={cycle.message} cycle={cycle.cycle} tasks={tasks} />}
          <ErrorMessage message={error} />
        </div>

        <div className="modal-footer">
          {isEdit && isOwner && (
            <button type="button" className="btn btn-ghost footer-start" onClick={onDelete}>
              <Icon name="trash" />
              Delete
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
