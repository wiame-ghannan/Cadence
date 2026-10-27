import Icon from "./Icon";

// Shows an error in an amber box, or nothing when message is empty
export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="error-message" role="alert">
      <Icon name="alert" />
      <span>{message}</span>
    </div>
  );
}
