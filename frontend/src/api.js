const API = "http://localhost:8000";

// Every API call throws this error when something goes wrong.
// status is the HTTP code, or 0 when the API could not be reached.
// detail is the raw "detail" sent by the API (a cycle is {message, cycle}).
export class ApiError extends Error {
  constructor(status, message, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

// App.jsx gives us a function to call when the token is refused (expired)
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// Turns the "detail" of an API error into a readable sentence
function errorMessage(status, detail) {
  if (typeof detail === "string") return detail;
  // 422 validation errors: a list of problems, we show the first one
  if (Array.isArray(detail) && detail.length > 0) return detail[0].msg;
  if (detail && detail.message) return detail.message;
  return `Error ${status}`;
}

// Sends one request to the API and returns the JSON answer.
// options: method, token (to be logged in), body (sent as JSON), form (sent as a form)
async function request(path, { method = "GET", token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    // /token expects a classic form, not JSON
    payload = new URLSearchParams(form);
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API}${path}`, { method, headers, body: payload });
  } catch {
    // fetch only fails when no readable answer came back:
    // API stopped, wrong port, or a response blocked by the browser (CORS)
    throw new ApiError(
      0,
      "Cannot reach the API. Check that it runs on http://localhost:8000."
    );
  }

  // 204 No Content has no body; a body that is not JSON is ignored
  let data = null;
  if (response.status !== 204) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const detail = data ? data.detail : undefined;
    // A refused token means the session is over
    if (response.status === 401 && token && onUnauthorized) onUnauthorized();
    throw new ApiError(response.status, errorMessage(response.status, detail), detail);
  }
  return data;
}

// ---------- Users ----------

// Returns the token of the user
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

// Creates an account and returns {id, email, name}
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

// Returns the logged in user: {id, email, name}
export function getMe(token) {
  return request("/users/me/", { token });
}

// ---------- Projects ----------

export function getProjects(token) {
  return request("/projects", { token });
}

// project is {name, description}
export function createProject(token, project) {
  return request("/project", { method: "POST", token, body: project });
}

// changes is {name, description}: only the owner can do it (403 otherwise)
export function updateProject(token, projectId, changes) {
  return request(`/project/${projectId}`, { method: "PATCH", token, body: changes });
}

export function deleteProject(token, projectId) {
  return request(`/project/${projectId}`, { method: "DELETE", token });
}

// ---------- Members ----------

// Returns [{id, user_id, project_id, role, name, email}]
export function getMembers(token, projectId) {
  return request(`/projects/${projectId}/members`, { token });
}

// Adds an existing account to the project (404 if no account has this email)
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

// Removes someone (owner only), or leaves the project when userId is yourself
export function removeMember(token, projectId, userId) {
  return request(`/projects/${projectId}/members/${userId}`, { method: "DELETE", token });
}

// ---------- Tasks ----------

export function getTasks(token, projectId) {
  return request(`/projects/${projectId}/tasks`, { token });
}

// task is {title, description, priority, duration, assigned_to, depends_on: [ids]}
export function createTask(token, projectId, task) {
  return request(`/projects/${projectId}/tasks`, { method: "POST", token, body: task });
}

// changes MUST contain "version": the version of the task we are looking at.
// The API answers 409 if someone changed the task since then.
export function updateTask(token, taskId, changes) {
  return request(`/tasks/${taskId}`, { method: "PATCH", token, body: changes });
}

export function deleteTask(token, taskId) {
  return request(`/tasks/${taskId}`, { method: "DELETE", token });
}

// ---------- Dependencies ----------

// Returns [{id, task_id, depends_on_task_id}]: the prerequisites of one task
export function getDependencies(token, taskId) {
  return request(`/tasks/${taskId}/dependencies`, { token });
}

// The API answers 400 with detail = {message, cycle} if this creates a cycle
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

// ---------- Schedule ----------

// Returns {order: [task ids]}: a valid execution order
export function getSchedule(token, projectId) {
  return request(`/projects/${projectId}/schedule`, { token });
}

// Returns {total_duration, critical_tasks, earliest_start, earliest_finish,
// latest_start, latest_finish, slack}. The dictionaries use task ids as text keys.
export function getCriticalPath(token, projectId) {
  return request(`/projects/${projectId}/critical-path`, { token });
}
