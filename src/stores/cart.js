import { defineStore } from 'pinia';

const EMPTY = { items: [], subtotal: 0, item_count: 0 };

function safeParseCart() {
    try {
        const raw = JSON.parse(localStorage.getItem('cart'));
        if (!raw) return { ...EMPTY };
        if (Array.isArray(raw)) return { items: raw, subtotal: 0, item_count: raw.length };
        return { items: Array.isArray(raw.items) ? raw.items : [], subtotal: +raw.subtotal || 0, item_count: +raw.item_count || 0 };
    } catch { localStorage.removeItem('cart'); return { ...EMPTY }; }
}

export const useCartStore = defineStore('cart', {
    state: () => {
        const cached = safeParseCart();
        return { items: cached.items, subtotal: cached.subtotal, item_count: cached.item_count, loaded: false };
    },

    getters: {
        numberOfItems: (state) => state.items.length,
        hasOutOfStock: (state) => state.items.find(i => +i.inventory < +i.qty) || false,
        hasMaxQty: (state) => state.items.find(i => +i.max_qty > 0 && +i.max_qty < +i.qty) || false,
    },

    actions: {
        saveCart() {
            localStorage.setItem('cart', JSON.stringify({ items: this.items, subtotal: this.subtotal, item_count: this.item_count }));
        },
        async init() {
            this.loaded = true;
        },
        async addProduct(product) {
            const existing = this.items.find(i => i.id === product.id);
            if (existing) {
                existing.qty += product.cart_quantity || 1;
            } else {
                this.items.push({
                    id: product.id,
                    name: product.name || 'Product',
                    price: product.price || 0,
                    qty: product.cart_quantity || 1,
                    image: product.image || null,
                    inventory: 99,
                    max_qty: 0,
                });
            }
            this.subtotal = this.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
            this.item_count = this.items.length;
            this.saveCart();
        },
        async updateQuantity({ id, qty }) {
            const item = this.items.find(i => i.id === id);
            if (item) { item.qty = qty; }
            this.subtotal = this.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
            this.saveCart();
        },
        async removeProduct(id) {
            this.items = this.items.filter(i => i.id !== id);
            this.subtotal = this.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
            this.item_count = this.items.length;
            this.saveCart();
        },
        async calculateShippingEstimate() {
            return [
                { id: 1, name: 'Standard Shipping', price: 5.99, estimated_days: '5-7 days' },
                { id: 2, name: 'Express Shipping', price: 14.99, estimated_days: '2-3 days' },
            ];
        },
        async recoverAfterLogin() {},
        async addBookingProduct(payload) { await this.addProduct(payload); },
        reset() {
            this.items = []; this.subtotal = 0; this.item_count = 0; this.loaded = false;
            localStorage.removeItem('cart');
        },
    },
});
