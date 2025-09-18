
import React from 'react';

interface MagicWandIconProps extends React.SVGProps<SVGSVGElement> {}

const MagicWandIcon: React.FC<MagicWandIconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 4V2" />
    <path d="M15 10V8" />
    <path d="M12.5 7.5h-1" />
    <path d="M17.5 7.5h-1" />
    <path d="M20 9.5V8.5" />
    <path d="M10 9.5V8.5" />
    <path d="m15 14-3.4 3.4" />
    <path d="M4.5 10.5 8 7" />
    <path d="M15 14l-1.4 1.4" />
    <path d="M12.5 11.5 10 9" />
    <path d="m5 21 6-6" />
    <path d="m14 15 6 6" />
    <path d="M19 10c-2.3.8-3.4 2.2-3.4 3.6" />
    <path d="M12.5 12.5a2.5 2.5 0 1 0-3.5-3.5 2.5 2.5 0 1 0 3.5 3.5Z" />
  </svg>
);

export default MagicWandIcon;
