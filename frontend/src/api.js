const API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(status, message, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function errorMessage(status, detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) return detail[0].msg;
  if (detail && detail.message) return detail.message;
  return `Error ${status}`;
}

async function request(path, { method = "GET", token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = new URLSearchParams(form);
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(
      0,
      `Cannot reach the API at ${API}. If the demo was idle, the server may be waking up: wait a minute and try again.`
    );
  }

  let data = null;
  if (response.status !== 204) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const detail = data ? data.detail : undefined;
    if (response.status === 401 && token && onUnauthorized) onUnauthorized();
    throw new ApiError(response.status, errorMessage(response.status, detail), detail);
  }
  return data;
}

export async function login(email, password) {
  try {
    const data = await request("/token", {
      method: "POST",
      form: { username: email, password },
    });
    return data.access_token;
  } catch (error) {
    if (error.status === 401) {
      throw new ApiError(401, "Wrong email or password.");
    }
    throw error;
  }
}

export async function register(name, email, password) {
  try {
    return await request("/users", {
      method: "POST",
      body: { name, email, password },
    });
  } catch (error) {
    if (error.status === 422) {
      throw new ApiError(422, "Check the form: a valid email, a name and a password are required.");
    }
    throw error;
  }
}

export function getMe(token) {
  return request("/users/me/", { token });
}

export function getProjects(token) {
  return request("/projects", { token });
}

export function createProject(token, project) {
  return request("/project", { method: "POST", token, body: project });
}

export function updateProject(token, projectId, changes) {
  return request(`/project/${projectId}`, { method: "PATCH", token, body: changes });
}

export function deleteProject(token, projectId) {
  return request(`/project/${projectId}`, { method: "DELETE", token });
}

export function getMembers(token, projectId) {
  return request(`/projects/${projectId}/members`, { token });
}

export function addMember(token, projectId, email, role) {
  return request(`/projects/${projectId}/members`, {
    method: "POST",
    token,
    body: { email, role },
  });
}

export function updateMemberRole(token, projectId, userId, role) {
  return request(`/projects/${projectId}/members/${userId}`, {
    method: "PATCH",
    token,
    body: { role },
  });
}

export function removeMember(token, projectId, userId) {
  return request(`/projects/${projectId}/members/${userId}`, { method: "DELETE", token });
}

export function getTasks(token, projectId) {
  return request(`/projects/${projectId}/tasks`, { token });
}

export function createTask(token, projectId, task) {
  return request(`/projects/${projectId}/tasks`, { method: "POST", token, body: task });
}

export function updateTask(token, taskId, changes) {
  return request(`/tasks/${taskId}`, { method: "PATCH", token, body: changes });
}

export function deleteTask(token, taskId) {
  return request(`/tasks/${taskId}`, { method: "DELETE", token });
}

export function getDependencies(token, taskId) {
  return request(`/tasks/${taskId}/dependencies`, { token });
}

export function addDependency(token, taskId, dependsOnTaskId) {
  return request(`/tasks/${taskId}/dependencies`, {
    method: "POST",
    token,
    body: { depends_on_task_id: dependsOnTaskId },
  });
}

export function removeDependency(token, taskId, dependsOnTaskId) {
  return request(`/tasks/${taskId}/dependencies/${dependsOnTaskId}`, {
    method: "DELETE",
    token,
  });
}

export function getSchedule(token, projectId) {
  return request(`/projects/${projectId}/schedule`, { token });
}

export function getCriticalPath(token, projectId) {
  return request(`/projects/${projectId}/critical-path`, { token });
}