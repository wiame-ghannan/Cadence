import Icon from "./Icon";
import Logo from "./Logo";
import ProjectList from "./ProjectList";
import Spinner from "./Spinner";

// First letter of the name, shown in the round avatar
function initial(user) {
  return user ? user.name.charAt(0).toUpperCase() : "?";
}

// Left column: logo, projects, "New project" button and the logged in user
export default function Sidebar({
  user,
  projects,
  loading,
  selectedId,
  onSelect,
  onNewProject,
  onLogout,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Logo />
      </div>

      <button className="btn btn-primary" onClick={onNewProject}>
        <Icon name="plus" />
        New project
      </button>

      <nav className="sidebar-projects" aria-label="Projects">
        <p className="sidebar-section-title">Projects</p>

        {loading && (
          <div className="sidebar-loading">
            <Spinner />
          </div>
        )}

        {!loading && projects.length === 0 && (
          <p className="sidebar-empty">No projects yet. Create the first one.</p>
        )}

        {!loading && (
          <ProjectList projects={projects} selectedId={selectedId} onSelect={onSelect} />
        )}
      </nav>

      <div className="sidebar-footer">
        <span className="avatar">{initial(user)}</span>
        <div className="user-info">
          <p className="user-name">{user ? user.name : "…"}</p>
          <p className="user-email" title={user ? user.email : ""}>
            {user ? user.email : ""}
          </p>
        </div>
        <button className="icon-button" onClick={onLogout} title="Log out" aria-label="Log out">
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}
