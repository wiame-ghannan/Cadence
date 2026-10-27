import Icon from "./Icon";

// projects is the list to display, selectedId is the open project,
// onSelect is called with the id of the clicked project
export default function ProjectList({ projects, selectedId, onSelect }) {
  return (
    <ul className="project-list">
      {projects.map((project) => (
        <li key={project.id}>
          <button
            className={project.id === selectedId ? "project-item is-active" : "project-item"}
            onClick={() => onSelect(project.id)}
            aria-current={project.id === selectedId ? "page" : undefined}
          >
            <Icon name="folder" />
            <span className="project-item-name">{project.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
