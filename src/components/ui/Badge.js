import React from 'react';
import './Badge.css';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  icon = null,
  ...props 
}) => {
  const classes = [
    'ui-badge',
    `ui-badge--${variant}`,
    `ui-badge--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {icon && <span className="ui-badge__icon">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
