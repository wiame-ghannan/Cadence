// A small spinning circle shown while something loads
export default function Spinner({ large = false }) {
  return (
    <span
      className={large ? "spinner spinner-large" : "spinner"}
      role="status"
      aria-label="Loading"
    />
  );
}
