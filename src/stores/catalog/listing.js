import { defineStore } from 'pinia';
import mockListing from '@/data/listing.json';

export const useListingStore = defineStore('listing', {
    state: () => ({
        products: [],
        paginationLinks: [],
        paginationInfo: {},
        filters: {},
        object: {},
        ancestors: [],
    }),

    actions: {
        setPagination(data) {
            const { paginator, filters, object, ancestors } = data;
            this.products = paginator.data;
            this.paginationLinks = paginator.links;
            this.paginationInfo = { from: paginator.from, to: paginator.to, total: paginator.total };
            this.filters = filters;
            this.object = object;
            this.ancestors = ancestors || [];
        },
        async fetchProductsByCategory(slug) {
            this.setPagination(mockListing);
        },
        async fetchProductsByManufacturer(slug) {
            this.setPagination(mockListing);
        },
        async fetchProductsByKeyword(keyword) {
            this.setPagination(mockListing);
        },
    },
});
