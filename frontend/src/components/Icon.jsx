// The SVG drawing of each icon (24 x 24 grid, drawn with lines)
const PATHS = {
  logo: "M4 16h4l4-10 4 10h4",
  plus: "M12 5v14 M5 12h14",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  close: "M18 6 6 18 M6 6l12 12",
  alert: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M12 8v4 M12 16h.01",
  check: "M20 6 9 17l-5-5",
  edit: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  trash: "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  board: "M4 4h16v16H4z M10 4v16 M15 4v16",
  timeline: "M4 6h9 M8 12h11 M6 18h7",
  clock: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M12 7v5l3 2",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  flag: "M5 21V4 M5 4h12l-2 4 2 4H5",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8z",
};

// Shows one icon, for example <Icon name="plus" />
export default function Icon({ name, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
