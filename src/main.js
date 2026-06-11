import './themes/default/storefront/css/style.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Storefront from './themes/default/Storefront.vue';

const pinia = createPinia();
const app = createApp(Storefront);

// ── Mock zucConfig (replaces Laravel Blade injection) ─────────────────
window.zucConfig = {
    store_name: 'Demo Store',
    store_url: 'http://localhost:5173',
    default_currency: 'USD',
    default_language: 'en',
    product_price_with_tax: 'n',
    enable_wishlist: 'y',
    enable_blog: 'y',
    enable_reviews: 'y',
    enable_registration: 'y',
    maintenance_mode: 'n',
    google_tag_manager_id: '',
    facebook_pixel_id: '',
    recaptcha_site_key: '',
};
app.config.globalProperties.zucConfig = window.zucConfig;

// ── Global components (SSR meta stubs) ────────────────────────────────
app.component('Head', { template: '<span></span>' });
app.component('Meta', { template: '<span></span>' });

// ── i18n ─────────────────────────────────────────────────────────────
import i18n from './i18n';

// ── Router ───────────────────────────────────────────────────────────
import router from './router';

// ── Toastification ───────────────────────────────────────────────────
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
app.use(Toast, { timeout: 4000, position: 'top-right' });

app.use(pinia).use(router).use(i18n).mount('#app');

// ── Dev Panel (dev only) ─────────────────────────────────────────────
if (import.meta.env.DEV) {
    import('./DevPanel.vue').then(({ default: DevPanel }) => {
        const devApp = createApp(DevPanel);
        devApp.use(pinia);
        const devEl = document.createElement('div');
        document.body.appendChild(devEl);
        devApp.mount(devEl);
    });
}
