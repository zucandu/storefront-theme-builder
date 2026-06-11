import { defineStore } from 'pinia';

export const useContactStore = defineStore('contact', {
    actions: {
        async submitContactForm() { return { success: true }; },
    },
});
