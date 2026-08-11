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

  const variants = {
    primary: 'bg-white text-black shadow-lg shadow-slate-900/10 hover:bg-slate-200 active:scale-[0.98]',
    secondary: 'bg-slate-900/90 hover:bg-slate-800 text-gray-100 border border-slate-700/70',
    ghost: 'bg-transparent hover:bg-slate-900/60 text-gray-300 hover:text-white',
    danger: 'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10'
  };

  const sizes = {
    sm: 'px-3 py-2 text-xs font-semibold',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base font-semibold'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
