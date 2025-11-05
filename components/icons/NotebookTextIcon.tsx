import React from 'react';

interface NotebookTextIconProps extends React.SVGProps<SVGSVGElement> {}

const NotebookTextIcon: React.FC<NotebookTextIconProps> = (props) => (
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
    <path d="M2 6h4" />
    <path d="M2 10h4" />
    <path d="M2 14h4" />
    <path d="M2 18h4" />
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <path d="M16 2v20" />
    <path d="M12 18h-1" />
    <path d="M12 14h-1" />
    <path d="M12 10h-1" />
    <path d="M12 6h-1" />
  </svg>
);

export default NotebookTextIcon;
