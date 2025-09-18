
import React from 'react';

interface QuillPenIconProps extends React.SVGProps<SVGSVGElement> {}

const QuillPenIcon: React.FC<QuillPenIconProps> = (props) => (
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
    <path d="M20.7 19.3c-1.2-1.2-2.9-1.2-4.1 0L4.5 21.5c-1.2 1.2-3.1 1.2-4.2 0-1.2-1.2-1.2-3.1 0-4.2l12.1-12.1c1.2-1.2 2.9-1.2 4.1 0l2.2 2.2c1.2 1.2 1.2 3 0 4.2l-1.1 1.1" />
    <path d="m15 5 6 6" />
    <path d="M11 9 4.5 15.5" />
  </svg>
);

export default QuillPenIcon;
