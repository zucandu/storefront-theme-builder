import { defineStore } from 'pinia';
import mockBanners from '@/data/banners.json';

export const useBannerStore = defineStore('banner', {
    state: () => ({ banners: [] }),
    actions: {
        async fetchBanners() {
            this.banners = mockBanners.banners || [];
        },
    },
});
