import React from 'react';

export const AgentLogo = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${className}`}
      aria-hidden="true"
    >
      {/* Sleek Minimalist Squircle Container */}
      <rect
        width="100"
        height="100"
        rx="24"
        fill="currentColor"
        className="text-zinc-900 dark:text-zinc-100"
      />

      {/* Razor-sharp Minimalist Geometric 'A' Monogram */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 20L78 78H63.5L50 49L36.5 78H22L50 20ZM50 36L58 52H42L50 36Z"
        fill="currentColor"
        className="text-white dark:text-zinc-950"
      />
    </svg>
  );
};

export default AgentLogo;
