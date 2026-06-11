import { defineStore } from 'pinia';
import mockMenuMain from '@/data/menu-main.json';
import mockMenuFooter from '@/data/menu-footer.json';

export const useMenuStore = defineStore('menu', {
    state: () => ({ menu: {} }),
    actions: {
        async fetchMenuByType(type) {
            if (type === 'main') return mockMenuMain.menu;
            if (type === 'footer') return mockMenuFooter.menu;
            return null;
        },
    },
});
