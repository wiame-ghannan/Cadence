import Icon from "./Icon";

// The Cadence logo: an indigo square and the name
export default function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark">
        <Icon name="logo" size={18} />
      </span>
      Cadence
    </span>
  );
}
