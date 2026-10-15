// DishArt — honest CSS/SVG food imagery placeholder.
// There are no real food photos in this demo build; each dish gets a warm,
// deterministic SVG tile (spice-toned gradient + cloche line art) derived
// from its name so the menu still feels appetizing. Real deployments should
// swap this for <Image> with actual dish photos.
const PALETTES: [string, string][] = [
  ["#f6e3c5", "#e8a94f"],
  ["#f7d9c4", "#d96f32"],
  ["#f3e6c8", "#c9a227"],
  ["#eed9c2", "#a8562a"],
  ["#f6dfd2", "#c2410c"],
  ["#efe3cd", "#8a6d3b"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function DishArt({
  name,
  veg,
  className = "",
}: {
  name: string;
  veg: boolean;
  className?: string;
}) {
  const [from, to] = PALETTES[hash(name) % PALETTES.length];
  const gid = `g${hash(name) % 9973}`;
  return (
    <svg viewBox="0 0 200 140" className={className} role="img" aria-label={name}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="200" height="140" fill={`url(#${gid})`} />
      <circle cx="100" cy="70" r="46" fill="none" stroke="#2b1d14" strokeWidth="3" opacity="0.85" />
      <path
        d="M58 92 Q100 118 142 92"
        fill="none"
        stroke="#2b1d14"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <line x1="100" y1="24" x2="100" y2="18" stroke="#2b1d14" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="15" r="4" fill="#2b1d14" />
      <path
        d="M72 62 q10 -12 20 0 q10 -12 20 0"
        fill="none"
        stroke="#2b1d14"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* veg / non-veg mark */}
      <rect x="10" y="10" width="18" height="18" rx="4" fill="#faf6ef" stroke={veg ? "#1a7a3c" : "#a4161a"} strokeWidth="2" />
      <circle cx="19" cy="19" r="5" fill={veg ? "#1a7a3c" : "#a4161a"} />
    </svg>
  );
}
