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
      {label && (
        <label
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <Icon
            className="absolute left-3.5 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full glass-input rounded-xl text-sm px-4 py-2.5 ${
            Icon ? 'pl-10' : ''
          }`}
          style={{
            borderColor: error ? '#ef4444' : 'var(--border-primary)'
          }}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </div>
  );
};

export default Input;
