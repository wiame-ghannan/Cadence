import { useState } from "react";
import Icon from "./Icon";
import { ROLE_LABELS } from "../labels";

// One member of the project.
// The owner sees a role menu and a remove button on the other rows;
// on their own row, everyone sees "Leave". Both ask for a confirmation.
// The API refuses to remove or demote the last owner, with a clear message.
export default function MemberRow({ member, user, isOwner, onRoleChange, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  const isMe = member.user_id === user.id;
  const canManage = isOwner && !isMe;

  // The button at the end of the row: "Leave" for yourself, a trash icon for
  // others (owner only), then a confirmation button after the first click
  let action = null;
  if (confirming) {
    action = (
      <button className="btn btn-strong btn-small" onClick={() => onRemove(member)}>
        {isMe ? "Confirm leave" : "Confirm remove"}
      </button>
    );
  } else if (isMe) {
    action = (
      <button className="btn btn-ghost btn-small" onClick={() => setConfirming(true)}>
        Leave
      </button>
    );
  } else if (canManage) {
    action = (
      <button
        className="icon-button"
        onClick={() => setConfirming(true)}
        title="Remove from project"
        aria-label={`Remove ${member.name}`}
      >
        <Icon name="trash" />
      </button>
    );
  }

  return (
    <li className="member-row">
      <span className="avatar">{member.name.charAt(0).toUpperCase()}</span>
      <div className="member-info">
        <p className="member-name">
          {member.name}
          {isMe && <span className="text-muted"> (you)</span>}
        </p>
        <p className="member-email">{member.email}</p>
      </div>

      {canManage ? (
        <select
          className="input input-small member-role"
          value={member.role}
          onChange={(e) => onRoleChange(member, e.target.value)}
          aria-label={`Role of ${member.name}`}
        >
          <option value="member">Member</option>
          <option value="owner">Owner</option>
        </select>
      ) : (
        <span className="badge badge-neutral">{ROLE_LABELS[member.role]}</span>
      )}

      {action}
    </li>
  );
}
