import { defineStore } from 'pinia';
import mockMenuPrimary from '@/data/menu-primary.json';
import mockMenuTertiary from '@/data/menu-tertiary.json';
import mockMenuFooterMiddle from '@/data/menu-footer-middle.json';
import mockMenuFooterBottom from '@/data/menu-footer-bottom.json';

const menuMap = {
    primary: mockMenuPrimary.menu,
    main: mockMenuPrimary.menu,
    tertiary: mockMenuTertiary.menu,
    'footer-middle': mockMenuFooterMiddle.menu,
    'footer-bottom': mockMenuFooterBottom.menu,
    footer: mockMenuFooterMiddle.menu,
};

export const useMenuStore = defineStore('menu', {
    state: () => ({ menu: {} }),
    actions: {
        async fetchMenuByType(type) {
            return menuMap[type] || null;
        },
    },
});
