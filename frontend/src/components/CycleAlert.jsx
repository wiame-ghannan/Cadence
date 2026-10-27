import Icon from "./Icon";
import { cycleText } from "../labels";

// Explains a dependency cycle sent by the API: "A → B → A"
export default function CycleAlert({ message, cycle, tasks }) {
  return (
    <div className="error-message" role="alert">
      <Icon name="alert" />
      <div>
        <p>
          <strong>{message}</strong>
        </p>
        <p className="cycle-path">{cycleText(cycle, tasks)}</p>
        <p>These tasks wait for each other, so none of them can start.</p>
      </div>
    </div>
  );
}
