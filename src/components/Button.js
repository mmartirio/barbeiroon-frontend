import React from 'react';
import './Button.css';

/**
 * Botão moderno, responsivo e acessível
 * Props: variant ('primary' | 'secondary' | 'danger'), loading, type, className, children, ...rest
 */
export default function Button({
  variant = 'primary',
  loading = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`modern-btn modern-btn-${variant} ${className}`}
      disabled={loading || rest.disabled}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <span className="modern-btn-spinner" aria-label="Carregando" />
      ) : (
        children
      )}
    </button>
  );
}
