import React from 'react';

export const AgentLogo = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="agentGradientComponent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Dark Obsidian Squircle */}
      <rect x="4" y="4" width="92" height="92" rx="26" fill="#0A0D17" stroke="url(#agentGradientComponent)" strokeWidth="3" />

      {/* Autonomous Agent 'A' Apex Wings */}
      <path d="M50 18 L80 72 L64 72 L50 44 L36 72 L20 72 Z" fill="url(#agentGradientComponent)" />

      {/* Intelligent Neural Core / Diamond Spark */}
      <polygon points="50,36 61,51 50,66 39,51" fill="#FFFFFF" />
      <circle cx="50" cy="51" r="4.5" fill="#06B6D4" />

      {/* Constellation Aperture Points */}
      <circle cx="50" cy="20" r="3" fill="#E0E7FF" />
      <circle cx="24" cy="68" r="2.5" fill="#38BDF8" />
      <circle cx="76" cy="68" r="2.5" fill="#38BDF8" />
    </svg>
  );
};

export default AgentLogo;
