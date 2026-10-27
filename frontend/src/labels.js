// Texts and small helpers shared by several components

export const STATUSES = ["todo", "in_progress", "done"];

export const STATUS_LABELS = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITIES = ["low", "medium", "high"];

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const ROLE_LABELS = {
  owner: "Owner",
  member: "Member",
};

// "1 day", "3 days"
export function formatDays(days) {
  return days === 1 ? "1 day" : `${days} days`;
}

// The API gives positions that start at 0 (start 0, finish 2).
// People count days from 1, so that task runs on "days 1–2".
export function dayRange(start, finish) {
  if (finish - start <= 1) return `day ${start + 1}`;
  return `days ${start + 1}–${finish}`;
}

// Name of a member from their user id: "Alice", or "Alice (you)"
export function memberName(userId, members, currentUser) {
  const member = members.find((m) => m.user_id === userId);
  const name = member ? member.name : `User #${userId}`;
  return currentUser && userId === currentUser.id ? `${name} (you)` : name;
}

// Prerequisites of a task that are not done yet: the task cannot start before them.
// prerequisiteIds is a list of task ids.
export function unfinishedTasks(prerequisiteIds, tasks) {
  return tasks.filter((t) => prerequisiteIds.includes(t.id) && t.status !== "done");
}

// Turns a cycle of ids [1, 2, 1] into "Design → Build → Design"
export function cycleText(cycle, tasks) {
  return cycle
    .map((id) => {
      const task = tasks.find((t) => t.id === id);
      return task ? task.title : `#${id}`;
    })
    .join(" → ");
}
