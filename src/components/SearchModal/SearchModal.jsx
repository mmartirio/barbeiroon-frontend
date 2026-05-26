import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import s from './SearchModal.module.css';

export default function SearchModal({ title, items = [], searchKey = 'name', onSelect, onClose, renderItem }) {
  const [query, setQuery] = useState('');
  const filtered = items.filter(item =>
    String(item[searchKey] || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.header}>
          <h3>{title}</h3>
          <button className={s.close} onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className={s.searchRow}>
          <FiSearch size={15} />
          <input
            autoFocus
            className={s.input}
            placeholder="Buscar..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className={s.list}>
          {filtered.length === 0
            ? <div className={s.empty}>Nenhum resultado</div>
            : filtered.map(item => (
              <button key={item.id} className={s.item} onClick={() => { onSelect(item); onClose(); }}>
                {renderItem ? renderItem(item) : <span>{item[searchKey]}</span>}
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
}
