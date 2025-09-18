
import React from 'react';

interface SparklesIconProps extends React.SVGProps<SVGSVGElement> {}

const SparklesIcon: React.FC<SparklesIconProps> = (props) => (
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
    <path d="M9.93 2.07a1 1 0 0 0-1.86 0L6.53 5.43a1 1 0 0 1-.8.8L2.37 7.77a1 1 0 0 0 0 1.86l3.36 1.54a1 1 0 0 1 .8.8l1.54 3.36a1 1 0 0 0 1.86 0l1.54-3.36a1 1 0 0 1 .8-.8l3.36-1.54a1 1 0 0 0 0-1.86l-3.36-1.54a1 1 0 0 1-.8-.8zM20 14l-1.5 3-3-1.5 3-1.5-1.5-3 1.5 3 3 1.5-3 1.5z" />
  </svg>
);

export default SparklesIcon;
