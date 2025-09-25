import React from 'react';

const HomeIcon = ({ size = 24, color = 'currentColor', filled = false }) => {
  if (filled) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={color} />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.84L19 12v7h-2v-6H7v6H5v-7l7-6.16z"
        fill={color}
      />
    </svg>
  );
};

export default HomeIcon;
