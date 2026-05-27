import React, { useState, useMemo } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchModal({ title, items = [], searchKey = 'name', onSelect, onClose, renderItem }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const lq = q.toLowerCase();
    return items.filter(it => {
      const keys = Array.isArray(searchKey) ? searchKey : [searchKey];
      return keys.some(k => String(it[k] || '').toLowerCase().includes(lq));
    });
  }, [items, q, searchKey]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div className="search-wrap">
            <FiSearch size={14} />
            <input className="search-input" placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)} autoFocus />
          </div>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>Nenhum resultado</p>
            </div>
          )}
          {filtered.map((item, i) => (
            <div
              key={item.id ?? i}
              onClick={() => { onSelect(item); onClose(); }}
              style={{ padding: '0.8rem 1.25rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              {renderItem ? renderItem(item) : (
                <span style={{ fontSize: '0.875rem' }}>{item[Array.isArray(searchKey) ? searchKey[0] : searchKey]}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
