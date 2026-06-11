import './themes/default/storefront/css/style.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const pinia = createPinia();
const app = createApp(App);

// zucConfig is defined in index.html before this module loads
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
