import { defineStore } from 'pinia';

export const useWishlistStore = defineStore('wishlist', {
    state: () => ({
        wishlists: [],
        productIds: [],
    }),

    getters: {
        inWishlist: (state) => (id) => state.productIds.includes(+id),
        isInWishlist: (state) => (id) => state.productIds.includes(+id),
        count: (state) => state.productIds.length,
    },

    actions: {
        async fetchWishlistIds() {
            this.productIds = [];
        },
        async fetchWishlists() {
            this.wishlists = [];
        },
        async toggleWishlist(productId) {
            const idx = this.productIds.indexOf(+productId);
            if (idx === -1) { this.productIds.push(+productId); return 'added'; }
            else { this.productIds.splice(idx, 1); return 'removed'; }
        },
        async toggleProduct(productId) {
            return this.toggleWishlist(productId);
        },
        async removeFromWishlist(productId) {
            this.productIds = this.productIds.filter(id => id !== +productId);
            this.wishlists = this.wishlists.filter(w => w.product_id !== productId);
        },
    },
});
