import React from 'react';

export const Input = ({
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold text-gray-400 tracking-wide uppercase">{label}</label>}
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full glass-input rounded-xl text-sm px-4 py-2.5 ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-white/10 focus:border-white/20' : 'border-white/10 focus:border-white/20'}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-gray-300 font-medium">{error}</span>}
    </div>
  );
};

export default Input;
