import { defineStore } from 'pinia';
import mockAccount from '@/data/account.json';

const MOCK_ORDER = {
    id: 1,
    ref: 'ORD-2025-001',
    status: 'delivered',
    total: '159.98',
    currency: 'USD',
    created_at: '2025-11-10T14:30:00Z',
    billing: {
        first_name: 'Jane', last_name: 'Smith',
        address1: '123 Maple Street', city: 'San Francisco',
        postcode: '94105', country: 'United States',
    },
    shipping: {
        first_name: 'Jane', last_name: 'Smith',
        address1: '123 Maple Street', city: 'San Francisco',
        postcode: '94105', country: 'United States',
    },
    items: [
        { id: 1, name: 'Classic Wooden Chair', qty: 1, price: '89.99', image: '/storage/products/chair.jpg' },
        { id: 2, name: 'Modern Desk Lamp', qty: 1, price: '45.00', image: '/storage/products/lamp.jpg' },
    ],
    shipping_method: { title: 'Standard Shipping', cost: '5.99' },
    payment_method: { name: 'Cash on Delivery' },
    tax_amount: '10.00',
    subtotal: '134.99',
    discount: '0',
    tracking: [],
};

export const useOrderStore = defineStore('order', {
    state: () => ({
        orderRef: '',
        checkoutSelections: {
            discounts: [],
            shipping: { id: null, title: '', cost: 0, code: '' },
            payment: {},
            promotions: {},
            comments: '',
        },
        checkoutParams: {
            total: 0,
            billing: {},
            shipping: {},
        },
        checkoutTaxAmount: 0,
        checkoutShippingCost: 0,
        checkoutDiscountModules: [],
        checkoutPaymentMethods: [
            { id: 'cod', name: 'Cash on Delivery', code: 'cod' },
            { id: 'bank_transfer', name: 'Bank Transfer', code: 'bank_transfer' },
        ],
        checkoutShippingMethods: [
            { id: 1, code: 'standard', title: 'Standard Shipping', cost: 5.99 },
            { id: 2, code: 'express', title: 'Express Shipping', cost: 14.99 },
        ],
        checkoutDraftId: null,
        readyToCheckout: true,
        prefilledAddress: null,
        retrieveOrder: { ...MOCK_ORDER },
    }),

    actions: {
        setCheckoutSelections(data) {
            this.checkoutSelections = { ...this.checkoutSelections, ...data };
        },
        setCheckoutPromotions(module, key, value) {
            if (!this.checkoutSelections.promotions[module]) {
                this.checkoutSelections.promotions[module] = {};
            }
            this.checkoutSelections.promotions[module][key] = value;
        },
        async connectPaymentGateway() {},
        async applyDiscount(promotions) {
            return { success: true };
        },
        async applyAppDiscount(module, input) {},
        async removeAppDiscount(module) {
            const next = { ...this.checkoutSelections.promotions };
            delete next[module];
            this.checkoutSelections.promotions = next;
        },
        prefillAddress(address) {
            this.prefilledAddress = address;
        },
        async fetchOrderDetailsByRef(ref) {
            this.retrieveOrder = { ...MOCK_ORDER, ref: ref || MOCK_ORDER.ref };
        },
        async fetchTrackingDetailsByRef(ref) {
            return { ref, events: [] };
        },
        async getPaymentRequest(token) {
            return { order: MOCK_ORDER };
        },
        async retrieveCustomerOrders() {
            return mockAccount.customer.orders || [];
        },
        async verify(formdata) {
            return { success: true };
        },
        async processReturn(formdata) {
            return { success: true };
        },
        async placeOrder() {
            this.orderRef = 'ORD-DEMO-' + Math.floor(Math.random() * 10000);
            return { ref: this.orderRef };
        },
    },
});
