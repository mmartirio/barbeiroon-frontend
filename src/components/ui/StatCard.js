import React from 'react';
import './StatCard.css';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue,
  variant = 'default',
  loading = false 
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? '↗' : '↘';
  };

  const getTrendClass = () => {
    if (!trend) return '';
    return trend === 'up' ? 'stat-card__trend--up' : 'stat-card__trend--down';
  };

  return (
    <div className={`stat-card stat-card--${variant}`}>
      <div className="stat-card__header">
        <div className="stat-card__icon">{icon}</div>
        <h3 className="stat-card__title">{title}</h3>
      </div>
      
      <div className="stat-card__body">
        {loading ? (
          <div className="stat-card__skeleton"></div>
        ) : (
          <>
            <p className="stat-card__value">{value}</p>
            {trendValue && (
              <div className={`stat-card__trend ${getTrendClass()}`}>
                <span className="stat-card__trend-icon">{getTrendIcon()}</span>
                <span className="stat-card__trend-value">{trendValue}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StatCard;
