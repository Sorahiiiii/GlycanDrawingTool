class LanguageManager {
    constructor() {
        this.currentLang = this.getCurrentLanguage();
        this.translations = {};
        this.init();
    }

    init() {
        this.loadLanguage(this.currentLang);
        this.setupLanguageSwitch();
    }

    getCurrentLanguage() {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam && ['zh', 'en'].includes(langParam)) {
            localStorage.setItem('preferredLanguage', langParam);
            return langParam;
        }

        // Check localStorage
        const stored = localStorage.getItem('preferredLanguage');
        if (stored && ['zh', 'en'].includes(stored)) {
            return stored;
        }

        // Default to Chinese
        return 'zh';
    }

    async loadLanguage(lang) {
        try {
            const response = await fetch('lang/' + lang + '.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.translations = await response.json();
            this.applyTranslations();
            this.updateLanguageSwitch();
        } catch (error) {
            console.error('Error loading language:', error);
            // Fallback to default language
            if (lang !== 'zh') {
                this.loadLanguage('zh');
            }
        }
    }

    applyTranslations() {
        // Update title
        if (this.translations.title) {
            document.title = this.translations.title;
        }

        // Update all elements with data-i18n attributes
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'placeholder') {
                    element.placeholder = translation;
                } else {
                    element.innerHTML = translation;
                }
            }
        });

        // Update all elements with data-i18n-title attributes
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.getTranslation(key);
            if (translation) {
                element.title = translation;
            }
        });

        // Update all elements with data-i18n-link attributes
        const linkElements = document.querySelectorAll('[data-i18n-link]');
        linkElements.forEach(element => {
            const key = element.getAttribute('data-i18n-link');
            const translation = this.getTranslation(key);
            if (translation) {
                element.href = translation;
            }
        });

        // Update language switch links
        const langLinks = document.querySelectorAll('.language-link');
        langLinks.forEach(link => {
            const lang = link.getAttribute('data-lang');
            if (lang && this.translations.languageSwitch && this.translations.languageSwitch[lang]) {
                link.textContent = this.translations.languageSwitch[lang];
            }
        });
    }

    getTranslation(key) {
        const keys = key.split('.');
        let value = this.translations;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        return value;
    }

    setupLanguageSwitch() {
        const langSwitch = document.querySelector('.language-switch');
        if (langSwitch) {
            langSwitch.addEventListener('click', (e) => {
                if (e.target.classList.contains('language-link')) {
                    e.preventDefault();
                    const lang = e.target.getAttribute('data-lang');
                    if (lang && lang !== this.currentLang) {
                        this.switchLanguage(lang);
                    }
                }
            });
        }
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);

        // Update URL without reloading
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);

        this.loadLanguage(lang);
    }

    updateLanguageSwitch() {
        const langSwitch = document.querySelector('.language-switch');
        if (langSwitch) {
            // Rebuild the language switch so the current language is NOT a hyperlink
            // but plain text, while the other language remains an anchor.
            const langs = ['zh', 'en'];
            const parts = [];
            langs.forEach((lang) => {
                const label = (this.translations && this.translations.languageSwitch && this.translations.languageSwitch[lang])
                    ? this.translations.languageSwitch[lang]
                    : (lang === 'zh' ? '中文' : 'EN');

                if (lang === this.currentLang) {
                    // Render current language as non-clickable text
                    parts.push(`<span class="language-current" data-lang="${lang}">${label}</span>`);
                } else {
                    // Other languages remain links so event delegation can catch clicks
                    parts.push(`<a href="#" class="language-link" data-lang="${lang}">${label}</a>`);
                }
            });

            // Join with separator and replace content
            langSwitch.innerHTML = parts.join(' | ');
        }
    }
}

// Initialize language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});