import { useState } from "react";
import { addMember, updateMemberRole, removeMember } from "../api";
import Modal from "./Modal";
import MemberRow from "./MemberRow";
import ErrorMessage from "./ErrorMessage";

// List of the project members. The owner can also add people by email,
// change their role and remove them. Anyone can leave the project.
// onChanged reloads the members, onLeft is called when the user left.
export default function MembersModal({
  token,
  projectId,
  members,
  user,
  isOwner,
  notify,
  onChanged,
  onLeft,
  onClose,
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Owners first, then by name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  async function handleInvite(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const member = await addMember(token, projectId, email.trim(), role);
      notify("success", `${member.name} added to the project.`);
      setEmail("");
      onChanged();
    } catch (err) {
      // 404: nobody has an account with this email yet
      setError(err.status === 404 ? "No account uses this email. Ask them to sign up first." : err.message);
    }
    setSaving(false);
  }

  async function handleRoleChange(member, newRole) {
    try {
      await updateMemberRole(token, projectId, member.user_id, newRole);
      notify("success", `${member.name} is now ${newRole === "owner" ? "an owner" : "a member"}.`);
      onChanged();
    } catch (err) {
      notify("error", err.message);
    }
  }

  async function handleRemove(member) {
    try {
      await removeMember(token, projectId, member.user_id);
      if (member.user_id === user.id) {
        onLeft();
      } else {
        notify("success", `${member.name} removed from the project.`);
        onChanged();
      }
    } catch (err) {
      notify("error", err.message);
    }
  }

  return (
    <Modal title="Members" onClose={onClose}>
      <div className="modal-body">
        {isOwner && (
          <form className="invite-form" onSubmit={handleInvite}>
            <div className="field-row">
              <label className="field">
                <span className="field-label">Email</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Role</span>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="owner">Owner</option>
                </select>
              </label>
            </div>
            <span className="field-hint">The person needs a Cadence account with this email.</span>
            <ErrorMessage message={error} />
            <button className="btn btn-primary" type="submit" disabled={saving || !email.trim()}>
              {saving ? "Adding…" : "Add member"}
            </button>
          </form>
        )}

        <ul className="member-list">
          {sortedMembers.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              user={user}
              isOwner={isOwner}
              onRoleChange={handleRoleChange}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      </div>
    </Modal>
  );
}
