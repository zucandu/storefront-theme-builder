import { defineStore } from 'pinia';
import mockAccount from '@/data/account.json';

export const useAuthCustomerStore = defineStore('authCustomer', {
    state: () => ({ profile: null }),

    getters: {
        customerInfo: (state) => state.profile || null,
        customerAddressTotal: (state) => state.profile?.addresses?.length || 0,
        customerAddresses: (state) => state.profile?.addresses || [],
        customerBillingAddress: (state) => state.profile?.addresses?.find(a => +a.id === +state.profile?.default_billing_address_id),
        customerShippingAddress: (state) => state.profile?.addresses?.find(a => +a.id === +state.profile?.default_shipping_address_id),
        isRegisteredCustomer: (state) => state.profile?.is_guest === 0,
        isLoggedIn: (state) => state.profile && !!localStorage.getItem('jwt_customer'),
        hasAccessToken: () => !!localStorage.getItem('jwt_customer'),
        customerTax: (state) => state.profile?.tax || undefined,
    },

    actions: {
        setCustomerAccessToken(token) {
            localStorage.setItem('jwt_customer', token);
        },
        setCustomerInfo(data) {
            this.profile = { ...data };
        },
        async fetchCustomerInfo() {
            if (localStorage.getItem('jwt_customer')) {
                this.profile = mockAccount.customer;
            }
        },
        clearCustomerAuth() {
            this.profile = null;
            localStorage.removeItem('jwt_customer');
        },
        async login(credentials) {
            localStorage.setItem('jwt_customer', 'mock-jwt-token');
            this.profile = mockAccount.customer;
            return { success: true };
        },
        async register() { return { success: true }; },
        async forgotPassword() { return { success: true }; },
        async resetPassword() { return { success: true }; },
        async updateProfile(data) { this.profile = { ...this.profile, ...data }; },
        async updatePassword() { return { success: true }; },
        async addNewAddress(data) {
            const newAddr = { id: Date.now(), ...data };
            this.profile.addresses = [...(this.profile.addresses || []), newAddr];
        },
        async updateAddress(data) {
            const idx = this.profile.addresses.findIndex(a => +a.id === +data.id);
            if (idx !== -1) this.profile.addresses[idx] = { ...this.profile.addresses[idx], ...data };
        },
        async deleteAddress(id) {
            this.profile.addresses = this.profile.addresses.filter(a => +a.id !== +id);
        },
        async convertGuestToAccount() { return { success: true }; },
        async checkEmailAvailability() { return { available: true }; },
        async subscribeNewsletter() { return { success: true }; },
    },
});
