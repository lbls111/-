
import React from 'react';

interface BrainCircuitIconProps extends React.SVGProps<SVGSVGElement> {}

const BrainCircuitIcon: React.FC<BrainCircuitIconProps> = (props) => (
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
    <path d="M12 2a2.5 2.5 0 0 0-2.5 2.5v.75a2.5 2.5 0 0 1-5 0v-.75A2.5 2.5 0 0 0 2 2" />
    <path d="M12 22a2.5 2.5 0 0 1 2.5-2.5v-.75a2.5 2.5 0 0 0 5 0v.75A2.5 2.5 0 0 1 22 22" />
    <path d="M17.5 4.5a2.5 2.5 0 0 0 0 5" />
    <path d="M22 12a2.5 2.5 0 0 1-2.5 2.5h-1" />
    <path d="M6.5 4.5a2.5 2.5 0 0 1 0 5" />
    <path d="M2 12a2.5 2.5 0 0 0 2.5 2.5h1" />
    <path d="M12 9.5a2.5 2.5 0 0 0 0 5" />
    <path d="M4.5 17.5a2.5 2.5 0 0 1 5 0" />
    <path d="M14.5 17.5a2.5 2.5 0 0 1 5 0" />
  </svg>
);

export default BrainCircuitIcon;
