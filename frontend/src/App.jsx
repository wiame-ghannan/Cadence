import { useEffect, useState } from "react";
import { getMe, getProjects, setUnauthorizedHandler } from "./api";
import LoginForm from "./components/LoginForm";
import Sidebar from "./components/Sidebar";
import ProjectModal from "./components/ProjectModal";
import ProjectView from "./components/ProjectView";
import ToastList from "./components/ToastList";
import EmptyState from "./components/EmptyState";
import ErrorMessage from "./components/ErrorMessage";
import Spinner from "./components/Spinner";
import Icon from "./components/Icon";

// The token is kept in the browser so a page reload does not log the user out.
// The browser can refuse storage (private mode), so every access is protected.
const TOKEN_KEY = "cadence_token";

function loadSavedToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Not saved: the user will just have to log in again after a reload
  }
}

// Each toast gets a different id so React can tell them apart
let nextToastId = 1;

export default function App() {
  // The token is null until the user is logged in
  const [token, setToken] = useState(loadSavedToken);
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Shows a toast for 5 seconds. type is "success" or "error".
  function notify(type, message) {
    const id = nextToastId++;
    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => dismissToast(id), 5000);
  }

  function dismissToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function logout() {
    saveToken(null);
    setToken(null);
    setUser(null);
    setProjects([]);
    setSelectedId(null);
  }

  // When the API refuses the token (expired after 30 minutes), log out
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      notify("error", "Your session has expired. Please log in again.");
    });
  }, []);

  // Each time we get a new token, load the user and their projects
  useEffect(() => {
    if (!token) return;

    async function loadAccount() {
      setLoadingProjects(true);
      setLoadError("");
      try {
        // Both requests are sent at the same time
        const [me, list] = await Promise.all([getMe(token), getProjects(token)]);
        setUser(me);
        setProjects(list);
      } catch (error) {
        // A 401 is already handled by the unauthorized handler above
        if (error.status !== 401) setLoadError(error.message);
      } finally {
        setLoadingProjects(false);
      }
    }

    loadAccount();
  }, [token]);

  // Called by LoginForm when the login works
  function handleLogin(newToken) {
    saveToken(newToken);
    setToken(newToken);
  }

  // Called by ProjectModal: add the project to the list and open it
  function handleProjectCreated(project) {
    setProjects([...projects, project]);
    setSelectedId(project.id);
    setShowNewProject(false);
    notify("success", `Project "${project.name}" created.`);
  }

  function handleProjectUpdated(project) {
    setProjects(projects.map((p) => (p.id === project.id ? project : p)));
  }

  function handleProjectDeleted(projectId) {
    setProjects(projects.filter((p) => p.id !== projectId));
    setSelectedId(null);
  }

  // Not logged in: only the login page
  if (!token) {
    return (
      <>
        <LoginForm onLogin={handleLogin} />
        <ToastList toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const selectedProject = projects.find((project) => project.id === selectedId);

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        projects={projects}
        loading={loadingProjects}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNewProject={() => setShowNewProject(true)}
        onLogout={logout}
      />

      <main className="main">
        <ErrorMessage message={loadError} />

        {/* Wait for the user: the project view needs to know who we are */}
        {!user && !loadError && (
          <div className="main-center">
            <Spinner large />
          </div>
        )}

        {user && selectedProject && (
          // key: a new ProjectView (with fresh state) for each project
          <ProjectView
            key={selectedProject.id}
            token={token}
            user={user}
            project={selectedProject}
            notify={notify}
            onProjectUpdated={handleProjectUpdated}
            onProjectDeleted={handleProjectDeleted}
          />
        )}

        {user && !selectedProject && (
          <div className="main-center">
            <EmptyState
              icon="folder"
              title={projects.length === 0 ? "No projects yet. Create the first one." : "Pick a project"}
              text="A project groups tasks and their dependencies. Cadence then computes its critical path."
              action={
                <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>
                  <Icon name="plus" />
                  New project
                </button>
              }
            />
          </div>
        )}
      </main>

      {showNewProject && (
        <ProjectModal
          token={token}
          onSaved={handleProjectCreated}
          onClose={() => setShowNewProject(false)}
        />
      )}

      <ToastList toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
