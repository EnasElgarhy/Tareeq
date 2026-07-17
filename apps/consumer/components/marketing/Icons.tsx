import type { ReactNode, SVGProps } from "react";

/**
 * Tareeq custom icon set — 24×24 stroke glyphs.
 * Primary strokes ride the shared brand gradient (gold → blush → violet);
 * secondary strokes use currentColor so the parent sets the dim tone.
 * Render <IconDefs /> once per page.
 */

export const IconDefs = () => (
  <svg width="0" height="0" className="absolute" aria-hidden="true">
    <defs>
      <linearGradient
        id="tq-icon"
        x1="3"
        y1="3"
        x2="21"
        y2="21"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#F4C660" />
        <stop offset="0.5" stopColor="#F2A8B3" />
        <stop offset="1" stopColor="#9D7FF0" />
      </linearGradient>
    </defs>
  </svg>
);

const G = "url(#tq-icon)";

export interface IconProps {
  size?: number | string;
}

interface SvgProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  size?: number | string;
  children: ReactNode;
}

const Svg = ({ size = 24, children, ...rest }: SvgProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IconCompass = ({ size }: IconProps) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" opacity="0.45" />
    <path d="M12 6.5 14.4 12 12 17.5 9.6 12Z" stroke={G} />
    <circle cx="12" cy="12" r="1" fill={G} stroke="none" />
  </Svg>
);

export const IconDialogue = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M4 11a7 7 0 0 1 7-7h2a7 7 0 1 1 0 14h-6l-3 2.5V11Z" stroke={G} />
    <path
      d="M12 9.2l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z"
      stroke="currentColor"
      opacity="0.55"
    />
  </Svg>
);

export const IconConstellation = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M5.5 17.5 10 10l5 3 4-7" stroke="currentColor" opacity="0.45" />
    <circle cx="5.5" cy="17.5" r="1.7" stroke={G} />
    <circle cx="10" cy="10" r="1.7" stroke={G} />
    <circle cx="15" cy="13" r="1.7" stroke={G} />
    <circle cx="19" cy="6" r="1.7" stroke={G} />
  </Svg>
);

export const IconSprout = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M12 20v-7" stroke={G} />
    <path d="M12 13c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z" stroke={G} />
    <path
      d="M12 11C12 8 10 6 7 6c0 3 2 5 5 5Z"
      stroke="currentColor"
      opacity="0.55"
    />
    <path d="M6.5 20h11" stroke="currentColor" opacity="0.45" />
  </Svg>
);

export const IconPath = ({ size }: IconProps) => (
  <Svg size={size}>
    <path
      d="M5 19c6 0 3-7 8-8.5C17.5 9.2 18.5 7 18.5 5"
      stroke={G}
      strokeDasharray="0.1 3.2"
    />
    <circle cx="5" cy="19" r="1.8" stroke={G} />
    <circle cx="18.5" cy="5" r="1.8" stroke="currentColor" opacity="0.55" />
  </Svg>
);

export const IconLens = ({ size }: IconProps) => (
  <Svg size={size}>
    <circle cx="10.5" cy="10.5" r="6" stroke={G} />
    <path d="m15.5 15.5 4 4" stroke={G} />
    <path
      d="M8 10.5a2.5 2.5 0 0 1 2.5-2.5"
      stroke="currentColor"
      opacity="0.55"
    />
  </Svg>
);

export const IconAudit = ({ size }: IconProps) => (
  <Svg size={size}>
    <path
      d="M12 3.5 19 7v5.5c0 4-3 7-7 8-4-1-7-4-7-8V7l7-3.5Z"
      stroke="currentColor"
      opacity="0.45"
    />
    <path d="m9 12 2.2 2.2L15.5 9.5" stroke={G} />
  </Svg>
);

export const IconPulse = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M3.5 12h4l2-4.5 3 9 2-4.5h5" stroke={G} />
    <circle cx="20" cy="12" r="0.2" stroke="currentColor" opacity="0.5" />
  </Svg>
);

export const IconSpark = ({ size }: IconProps) => (
  <Svg size={size}>
    <path
      d="M12 4c.7 3.8 3 6.3 7 7-4 .7-6.3 3.2-7 7-.7-3.8-3-6.3-7-7 4-.7 6.3-3.2 7-7Z"
      stroke={G}
    />
    <path
      d="M18.5 16.5l.4 1.6 1.6.4-1.6.4-.4 1.6-.4-1.6-1.6-.4 1.6-.4.4-1.6Z"
      stroke="currentColor"
      opacity="0.55"
    />
  </Svg>
);

export const IconMemory = ({ size }: IconProps) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="3.2" stroke={G} />
    <path d="M12 2.8a9.2 9.2 0 0 1 9.2 9.2" stroke={G} />
    <path d="M12 21.2A9.2 9.2 0 0 1 2.8 12" stroke={G} />
    <path
      d="M12 6a6 6 0 0 1 6 6M12 18a6 6 0 0 1-6-6"
      stroke="currentColor"
      opacity="0.45"
    />
  </Svg>
);

export const IconPlan = ({ size }: IconProps) => (
  <Svg size={size}>
    <rect
      x="4.5"
      y="4"
      width="15"
      height="16.5"
      rx="3"
      stroke="currentColor"
      opacity="0.45"
    />
    <path d="m8 9.5 1.4 1.4 2.6-2.9" stroke={G} />
    <path d="M14.5 10h2" stroke={G} />
    <path d="m8 15.5 1.4 1.4 2.6-2.9" stroke={G} />
    <path d="M14.5 16h2" stroke={G} />
  </Svg>
);

export const IconBook = ({ size }: IconProps) => (
  <Svg size={size}>
    <path
      d="M12 6.5C10.5 5 8.5 4.5 4.5 4.5v13c4 0 6 .5 7.5 2 1.5-1.5 3.5-2 7.5-2v-13c-4 0-6 .5-7.5 2Z"
      stroke={G}
    />
    <path d="M12 6.5v13" stroke="currentColor" opacity="0.45" />
  </Svg>
);

export const IconPlay = ({ size }: IconProps) => (
  <Svg size={size}>
    <rect
      x="3.5"
      y="5"
      width="17"
      height="14"
      rx="4"
      stroke="currentColor"
      opacity="0.45"
    />
    <path d="M10.5 9.2v5.6l4.6-2.8-4.6-2.8Z" stroke={G} />
  </Svg>
);

export const IconUniversity = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="m12 3.5 8.5 4.5H3.5L12 3.5Z" stroke={G} />
    <path
      d="M5.5 8v8M10 8v8M14 8v8M18.5 8v8"
      stroke="currentColor"
      opacity="0.45"
    />
    <path d="M3.5 20.5h17" stroke={G} />
  </Svg>
);

export const IconVenn = ({ size }: IconProps) => (
  <Svg size={size}>
    <circle cx="9.5" cy="12" r="6" stroke={G} />
    <circle cx="14.5" cy="12" r="6" stroke="currentColor" opacity="0.5" />
  </Svg>
);

export const IconFamily = ({ size }: IconProps) => (
  <Svg size={size}>
    <circle cx="8.5" cy="8.5" r="3" stroke={G} />
    <path d="M3.5 19.5c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke={G} />
    <circle cx="16.5" cy="9.5" r="2.4" stroke="currentColor" opacity="0.5" />
    <path d="M15.5 14.7c2.8 0 5 2 5 4.8" stroke="currentColor" opacity="0.5" />
  </Svg>
);

export const IconTrend = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M3.5 20.5h17" stroke="currentColor" opacity="0.45" />
    <path d="m4.5 15.5 4.5-4.5 3.5 3 6.5-7" stroke={G} />
    <path d="M15.5 7H19v3.5" stroke={G} />
  </Svg>
);

export const IconArrow = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M4.5 12h14M13.5 6.5 19 12l-5.5 5.5" stroke={G} />
  </Svg>
);

export const IconSend = ({ size }: IconProps) => (
  <Svg size={size}>
    <path
      d="M20 4.5 10.5 14M20 4.5 14 20l-3.5-6L4 10.5 20 4.5Z"
      stroke="currentColor"
    />
  </Svg>
);

export const IconPlus = ({ size }: IconProps) => (
  <Svg size={size}>
    <path d="M12 5.5v13M5.5 12h13" stroke="currentColor" />
  </Svg>
);
