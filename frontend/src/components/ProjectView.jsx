import { useEffect, useState } from "react";
import {
  getTasks,
  getMembers,
  getDependencies,
  getCriticalPath,
  getSchedule,
  updateTask,
  deleteTask,
  deleteProject,
} from "../api";
import { STATUS_LABELS, cycleText } from "../labels";
import ProjectHeader from "./ProjectHeader";
import TaskBoard from "./TaskBoard";
import Timeline from "./Timeline";
import TaskModal from "./TaskModal";
import MembersModal from "./MembersModal";
import ProjectModal from "./ProjectModal";
import ConfirmModal from "./ConfirmModal";
import CycleAlert from "./CycleAlert";
import EmptyState from "./EmptyState";
import ErrorMessage from "./ErrorMessage";
import Spinner from "./Spinner";
import Icon from "./Icon";

// Everything about one open project: header, board or timeline, and the modals.
// App.jsx gives it a "key" so this component starts fresh for each project.
export default function ProjectView({ token, user, project, notify, onProjectUpdated, onProjectDeleted }) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  // For each task id, the ids of the tasks it waits for: {3: [1, 2]}
  const [prerequisites, setPrerequisites] = useState({});
  // Result of /critical-path, or null when it cannot be computed
  const [plan, setPlan] = useState(null);
  // Execution order from /schedule: [task ids]
  const [order, setOrder] = useState([]);
  // {message, cycle} when the dependencies are circular
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  // Changing this number reloads the project (see useEffect below)
  const [reloadCount, setReloadCount] = useState(0);

  // "board" or "timeline"
  const [view, setView] = useState("board");
  // Which modal is open: null, "new-task", "edit-task", "delete-task",
  // "members", "edit-project" or "delete-project"
  const [openModal, setOpenModal] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Load (or reload) tasks, members, dependencies and the plan
  useEffect(() => {
    async function loadProject() {
      try {
        const [taskList, memberList] = await Promise.all([
          getTasks(token, project.id),
          getMembers(token, project.id),
        ]);

        // The API has no route for all the dependencies of a project,
        // so we ask each task for its own prerequisites
        const dependencyLists = await Promise.all(
          taskList.map((task) => getDependencies(token, task.id))
        );
        const prerequisitesByTask = {};
        taskList.forEach((task, index) => {
          prerequisitesByTask[task.id] = dependencyLists[index].map((dep) => dep.depends_on_task_id);
        });

        setTasks(taskList);
        setMembers(memberList);
        setPrerequisites(prerequisitesByTask);
        setLoadError("");

        // The plan fails with 400 when the dependencies form a cycle
        try {
          const [criticalPath, schedule] = await Promise.all([
            getCriticalPath(token, project.id),
            getSchedule(token, project.id),
          ]);
          setPlan(criticalPath);
          setOrder(schedule.order);
          setCycle(null);
        } catch (error) {
          if (error.status === 400 && error.detail && error.detail.cycle) {
            setPlan(null);
            setOrder([]);
            setCycle(error.detail);
          } else {
            throw error;
          }
        }
      } catch (error) {
        setLoadError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [token, project.id, reloadCount]);

  function reload() {
    setReloadCount((count) => count + 1);
  }

  // Only the owner can create or delete tasks, change dependencies,
  // edit or delete the project and manage members
  const myMembership = members.find((member) => member.user_id === user.id);
  const isOwner = Boolean(myMembership && myMembership.role === "owner");

  // Shows an API error as a toast, with special cases for 409 and cycles
  function showError(error) {
    if (error.status === 409) {
      notify("error", "This task was modified by someone else. The tasks have been reloaded.");
      reload();
    } else if (error.status === 400 && error.detail && error.detail.cycle) {
      notify("error", `${error.detail.message}: ${cycleText(error.detail.cycle, tasks)}`);
    } else {
      notify("error", error.message);
    }
  }

  function openTask(task) {
    setSelectedTask(task);
    setOpenModal("edit-task");
  }

  function closeModal() {
    setOpenModal(null);
    setSelectedTask(null);
  }

  // Status menu on a card: send the version we saw, get the new version back
  async function handleStatusChange(task, status) {
    try {
      const updated = await updateTask(token, task.id, { version: task.version, status });
      setTasks((current) => current.map((t) => (t.id === updated.id ? updated : t)));
      notify("success", `"${task.title}" moved to ${STATUS_LABELS[status]}.`);
    } catch (error) {
      showError(error);
    }
  }

  // Called by TaskModal when a task was created or edited
  function handleTaskSaved(message) {
    closeModal();
    notify("success", message);
    reload();
  }

  // Called by TaskModal on a 409: close it and reload the tasks
  function handleTaskConflict(error) {
    closeModal();
    showError(error);
  }

  async function handleDeleteTask() {
    const task = selectedTask;
    try {
      // The API also deletes the dependencies to and from this task
      await deleteTask(token, task.id);
      notify("success", `"${task.title}" deleted.`);
    } catch (error) {
      showError(error);
    }
    closeModal();
    reload();
  }

  async function handleDeleteProject() {
    try {
      await deleteProject(token, project.id);
      notify("success", `Project "${project.name}" deleted.`);
      onProjectDeleted(project.id);
    } catch (error) {
      showError(error);
      closeModal();
    }
  }

  // Called by MembersModal when the user left the project
  function handleLeftProject() {
    notify("success", `You left "${project.name}".`);
    onProjectDeleted(project.id);
  }

  function handleProjectSaved(saved) {
    closeModal();
    notify("success", "Project updated.");
    onProjectUpdated(saved);
  }

  if (loading) {
    return (
      <div className="main-center">
        <Spinner large />
      </div>
    );
  }

  return (
    <div className="project-view">
      <ProjectHeader
        project={project}
        isOwner={isOwner}
        plan={plan}
        taskCount={tasks.length}
        memberCount={members.length}
        view={view}
        onViewChange={setView}
        onNewTask={() => setOpenModal("new-task")}
        onMembers={() => setOpenModal("members")}
        onEditProject={() => setOpenModal("edit-project")}
        onDeleteProject={() => setOpenModal("delete-project")}
      />

      <ErrorMessage message={loadError} />

      {cycle && <CycleAlert message={cycle.message} cycle={cycle.cycle} tasks={tasks} />}

      {tasks.length === 0 && (
        <EmptyState
          icon="board"
          title="No tasks yet"
          text={
            isOwner
              ? "Add tasks and their prerequisites: Cadence will compute the critical path."
              : "Only the project owner can add tasks. They will appear here."
          }
          action={
            isOwner && (
              <button className="btn btn-primary" onClick={() => setOpenModal("new-task")}>
                <Icon name="plus" />
                New task
              </button>
            )
          }
        />
      )}

      {tasks.length > 0 && view === "board" && (
        <TaskBoard
          tasks={tasks}
          plan={plan}
          prerequisites={prerequisites}
          members={members}
          user={user}
          onOpen={openTask}
          onStatusChange={handleStatusChange}
        />
      )}

      {tasks.length > 0 && view === "timeline" && (
        <Timeline tasks={tasks} plan={plan} order={order} onOpen={openTask} />
      )}

      {(openModal === "new-task" || openModal === "edit-task") && (
        <TaskModal
          token={token}
          projectId={project.id}
          task={openModal === "edit-task" ? selectedTask : null}
          tasks={tasks}
          prerequisites={prerequisites}
          members={members}
          user={user}
          isOwner={isOwner}
          onSaved={handleTaskSaved}
          onConflict={handleTaskConflict}
          onDependenciesChanged={reload}
          onDelete={() => setOpenModal("delete-task")}
          onClose={closeModal}
        />
      )}

      {openModal === "delete-task" && (
        <ConfirmModal
          title="Delete task"
          message={`"${selectedTask.title}" will be deleted, and the tasks waiting for it will no longer depend on it. This cannot be undone.`}
          confirmLabel="Delete task"
          onConfirm={handleDeleteTask}
          onClose={closeModal}
        />
      )}

      {openModal === "members" && (
        <MembersModal
          token={token}
          projectId={project.id}
          members={members}
          user={user}
          isOwner={isOwner}
          notify={notify}
          onChanged={reload}
          onLeft={handleLeftProject}
          onClose={closeModal}
        />
      )}

      {openModal === "edit-project" && (
        <ProjectModal
          token={token}
          project={project}
          onSaved={handleProjectSaved}
          onClose={closeModal}
        />
      )}

      {openModal === "delete-project" && (
        <ConfirmModal
          title="Delete project"
          message={`"${project.name}", its tasks and its members will be deleted. This cannot be undone.`}
          confirmLabel="Delete project"
          onConfirm={handleDeleteProject}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
