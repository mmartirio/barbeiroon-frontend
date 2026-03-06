import React from 'react';
import './Card.css';

export const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = false,
  padding = 'md',
  ...props 
}) => {
  const classes = [
    'ui-card',
    `ui-card--${variant}`,
    `ui-card--padding-${padding}`,
    hover && 'ui-card--hover',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`ui-card__header ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '', ...props }) => (
  <div className={`ui-card__body ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`ui-card__footer ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`ui-card__title ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`ui-card__description ${className}`} {...props}>
    {children}
  </p>
);
