// @ts-check

import { EventEmitter } from '@supercat1337/event-emitter';

const events = new EventEmitter();
let currentLang = 'en';

const translations = {
    en: {
        greeting: 'Hello, {name}!',
        counter: 'You have clicked {count} times',
        english: 'English',
        russian: 'Русский',
    },
    ru: {
        greeting: 'Привет, {name}!',
        counter: 'Вы нажали {count} раз',
        english: 'Английский',
        russian: 'Русский',
    },
};

// @ts-ignore
export function t(key, params = {}) {
    // @ts-ignore
    let str = translations[currentLang][key] || key;
    Object.keys(params).forEach(p => {
        // @ts-ignore
        str = str.replace(`{${p}}`, params[p]);
    });
    return str;
}

/**
 *
 * @param {string} lang
 * @returns
 */
export function setLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    events.emit('languageChanged', lang);
}

/**
 *
 * @param {Function} callback
 * @returns
 */
export function onLanguageChange(callback) {
    events.on('languageChanged', callback);
    return () => events.off('languageChanged', callback);
}
