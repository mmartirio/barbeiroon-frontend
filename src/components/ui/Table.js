import React from 'react';
import './Table.css';

export const Table = ({ children, className = '', striped = false, hover = true, ...props }) => {
  const classes = [
    'ui-table',
    striped && 'ui-table--striped',
    hover && 'ui-table--hover',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="ui-table-wrapper">
      <table className={classes} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHead = ({ children, className = '', ...props }) => (
  <thead className={`ui-table__head ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '', ...props }) => (
  <tbody className={`ui-table__body ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', ...props }) => (
  <tr className={`ui-table__row ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHeader = ({ children, className = '', ...props }) => (
  <th className={`ui-table__header ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '', ...props }) => (
  <td className={`ui-table__cell ${className}`} {...props}>
    {children}
  </td>
);
