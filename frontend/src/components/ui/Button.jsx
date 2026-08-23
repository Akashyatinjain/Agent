import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-semibold',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base font-semibold'
  }[size] || 'px-4 py-2.5 text-sm';

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-primary)'
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)'
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          color: '#ffffff'
        };
      case 'primary':
      default:
        return {
          backgroundColor: 'var(--bg-accent)',
          color: 'var(--text-on-accent)',
          boxShadow: 'var(--shadow-sm)'
        };
    }
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={getVariantStyle()}
      className={`${baseStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
