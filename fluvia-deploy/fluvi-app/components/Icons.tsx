// tiny inline icon set (stroke style, lucide-ish) — avoids an icon dependency
type IconProps = { className?: string };

function base(className?: string) {
  return {
    className: className ?? "w-5 h-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export const Bolt = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
  </svg>
);

export const ArrowRight = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const ChevronDown = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const Check = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const Shield = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
  </svg>
);

export const Key = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m10.7 12.3 8.8-8.8" />
    <path d="m17 6 2.5 2.5" />
    <path d="m13.5 9.5 2.5 2.5" />
  </svg>
);

export const Wallet = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="3" y="6" width="18" height="14" rx="2.5" />
    <path d="M3 10h18" />
    <path d="M16 15h.01" />
  </svg>
);

export const Clock = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

export const Globe = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
  </svg>
);

export const Code = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m8 8-5 4 5 4" />
    <path d="m16 8 5 4-5 4" />
    <path d="m13.5 5-3 14" />
  </svg>
);

export const Percent = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M19 5 5 19" />
    <circle cx="7" cy="7" r="2.5" />
    <circle cx="17" cy="17" r="2.5" />
  </svg>
);

export const Layers = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m12 2 9 5-9 5-9-5 9-5z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 17 9 5 9-5" />
  </svg>
);

export const Landmark = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M3 21h18" />
    <path d="M5 21V10" />
    <path d="M19 21V10" />
    <path d="M3 10h18" />
    <path d="M12 3 2.5 8h19L12 3z" />
  </svg>
);

export const Send = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m22 2-7 20-4-9-9-4 20-7z" />
    <path d="M22 2 11 13" />
  </svg>
);

export const Copy = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const Refresh = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const Alert = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export const Lock = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const Sparkle = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="m4.9 4.9 2.8 2.8" />
    <path d="m16.3 16.3 2.8 2.8" />
    <path d="m4.9 19.1 2.8-2.8" />
    <path d="m16.3 7.7 2.8-2.8" />
  </svg>
);

export const Logo = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className ?? "w-7 h-7"}>
    <path d="M4 18 13 4h2L6 18H4z" fill="url(#logo-g)" />
    <path d="M13 18 22 4h-2l-7 14h0z" fill="url(#logo-g)" opacity="0.55" />
    <defs>
      <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#22D3EE" />
        <stop offset="0.5" stopColor="#2DD4BF" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);
