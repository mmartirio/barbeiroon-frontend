import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import s from './Layout.module.css';

export default function Layout({ children, title, subtitle }) {
  return (
    <div className={s.shell}>
      <Sidebar />
      <main className={s.main}>
        <div className={s.content}>
          {(title || subtitle) && (
            <div className={s.pageHeader}>
              {title    && <h1 className={s.pageTitle}>{title}</h1>}
              {subtitle && <p className={s.pageSubtitle}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
