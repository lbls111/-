
import React from 'react';

interface FilePenIconProps extends React.SVGProps<SVGSVGElement> {}

const FilePenIcon: React.FC<FilePenIconProps> = (props) => (
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
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z" />
  </svg>
);

export default FilePenIcon;
