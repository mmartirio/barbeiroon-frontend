import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const languages = [
  { code: 'pt-BR', label: '🇧🇷 Português' },
  { code: 'en-US', label: '🇺🇸 English' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <div className="language-switcher">
      {languages.map(lang => (
        <button
          key={lang.code}
          className={current === lang.code ? 'active' : ''}
          onClick={() => {
            i18n.changeLanguage(lang.code);
            localStorage.setItem('language', lang.code);
          }}
          aria-label={`Mudar idioma para ${lang.label}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
