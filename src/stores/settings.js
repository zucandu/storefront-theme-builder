import { defineStore } from 'pinia';
import mockSettings from '@/data/settings.json';

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        currencies: [],
        countries: [],
        selectedCurrency: localStorage.getItem('selectedCurrency') || window.zucConfig.default_currency,
        languages: [],
        selectedLanguage: localStorage.getItem('selectedLanguage') || window.zucConfig.default_language,
        taxes: [],
        metaTags: [],
    }),

    getters: {
        languagePrefix: () => '',
        selectedCurrencyObject: (state) => state.currencies.find(c => c.code === state.selectedCurrency),
        findCurrencyByCode: (state) => (code) => state.currencies.find(c => c.code === code),
        activeCurrency: (state) => state.currencies.find(c => c.code === state.selectedCurrency),
        findLanguageByISO: (state) => (code) => state.languages.find(l => l.iso_code === code),
        activeLanguage: (state) => state.languages.find(l => l.iso_code === state.selectedLanguage),
        defaultTaxSettings: (state) => state.taxes || [],
        getZonesByCountryId: (state) => (id) => state.countries.find(c => +c.id === +id)?.zones || [],
        getCountryById: (state) => (id) => state.countries.find(c => +c.id === +id),
        getCountryByCode: (state) => (code) => state.countries.find(c => c.iso_code_2 === code),
        translation: () => (item, field, locale) => item?.translations?.find(t => t.locale === locale)?.[field],
        transObj: () => (item, locale) => item?.translations?.find(t => t.locale === locale),
        getMetatagsByName: (state) => (name) => state.metaTags.find(m => m.pagename === name),
    },

    actions: {
        setSelectedCurrency(currency) {
            this.selectedCurrency = currency;
            localStorage.setItem('selectedCurrency', currency);
        },
        setSelectedLanguage(language) {
            this.selectedLanguage = language;
            localStorage.setItem('selectedLanguage', language);
        },
        setCountries(data) {
            this.countries = data;
        },
        async fetchSettings() {
            const { currencies, languages, taxes, meta, countries } = mockSettings;
            this.currencies = currencies || [];
            this.languages = languages || [];
            this.taxes = taxes || [];
            this.metaTags = meta || [];
            this.countries = countries || [];
        },
        async fetchCountries() {
            this.countries = mockSettings.countries || [];
        },
        changeLanguage() {},
    },
});
