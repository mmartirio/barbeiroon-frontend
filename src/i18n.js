import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
};


// Sempre pt-BR por padrão, só muda se explicitamente solicitado
const savedLang = localStorage.getItem('language');
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang === 'en-US' ? 'en-US' : 'pt-BR',
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
