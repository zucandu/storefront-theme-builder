<script setup>
import LayoutHeader from '@theme/storefront/components/layout/Header.vue'
import LayoutFooter from '@theme/storefront/components/layout/Footer.vue'
import { onMounted, ref } from 'vue';

import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { useSettingsStore } from '@/stores/settings';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';
import { useHelpers } from '@/composables/useHelpers';

const router = useRouter();
const settingsStore = useSettingsStore();
const authCustomerStore = useAuthCustomerStore();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const { translateItemObj } = useHelpers();

const loaded = ref(false);
const { locale } = useI18n();

onMounted(async () => {
    await settingsStore.fetchSettings();
    await authCustomerStore.fetchCustomerInfo().finally(() => loaded.value = true);

    // Initialize cart from server (works for both guest and logged-in)
    cartStore.init();

    // Load wishlist IDs for logged-in customers (lightweight)
    wishlistStore.fetchWishlistIds();

    // Set meta tags for the initial page load
    applyMetaTags(router.currentRoute.value);

});

// Auto-update meta tags on every route change
router.afterEach((to) => {
    applyMetaTags(to);
});

/**
 * Applies document title and meta description based on route name.
 * Static pages use meta_tags table (matched by route.name).
 * Dynamic pages (product, category, etc.) set their own title after fetching data.
 */
function applyMetaTags(route) {
    let meta = settingsStore.getMetatagsByName(route.name);
    if (!meta) {
        // Fallback to parent route (e.g. account children → account)
        const parentRoute = route.matched.length > 1 ? route.matched[route.matched.length - 2] : null;
        if (parentRoute) meta = settingsStore.getMetatagsByName(parentRoute.name);
    }

    if (meta) {
        const translation = translateItemObj(meta, locale.value);
        if (translation?.meta_title) document.title = translation.meta_title;
        setMetaDescription(translation?.meta_description);
    } else {
        // Fallback for pages without meta tags entry
        document.title = zucConfig.store_name;
        setMetaDescription('');
    }
}

function setMetaDescription(content) {
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
        el = document.createElement('meta');
        el.name = 'description';
        document.head.appendChild(el);
    }
    el.content = content || zucConfig.store_name;
}

</script>

<template>
    <div class="storefront-shell min-h-screen flex flex-col bg-white">
        <template v-if="loaded">
            <layout-header />
            <main class="flex-1">
                <router-view />
            </main>
            <layout-footer />
        </template>

        <!-- Loading skeleton -->
        <template v-else>
            <div class="animate-pulse">
                <!-- Top bar -->
                <div class="h-8 bg-[#111111] border-b border-[#c8a45c]/30" />
                <!-- Header skeleton (dark) -->
                <div class="bg-[#1a1a1a]">
                    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div class="flex items-center h-[4.5rem] gap-5">
                            <div class="flex flex-col gap-1">
                                <div class="h-6 w-32 rounded-sm bg-white/10" />
                                <div class="h-2 w-20 rounded-sm bg-white/5 hidden sm:block" />
                            </div>
                            <div class="hidden md:block flex-1 max-w-xl mx-auto h-10 rounded-sm bg-white/5" />
                            <div class="flex items-center gap-3 ml-auto">
                                <div class="h-8 w-20 rounded-sm bg-white/5 hidden lg:block" />
                                <div class="h-8 w-20 rounded-sm bg-white/5 hidden lg:block" />
                                <div class="h-8 w-16 rounded-sm bg-white/5 hidden lg:block" />
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Nav bar skeleton -->
                <div class="h-11 bg-[#1a1a1a] border-t border-white/5" />

                <!-- Hero skeleton -->
                <div class="aspect-[21/9] sm:aspect-[21/8] lg:aspect-[21/7] bg-gray-200" />

                <!-- Service bar skeleton -->
                <div class="bg-[#f5f0e8]">
                    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div class="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-[#e0d8c8]">
                            <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-4 sm:justify-center">
                                <div class="size-9 rounded-full bg-[#ddd5c5]" />
                                <div class="space-y-1.5">
                                    <div class="h-3.5 w-28 rounded bg-[#ddd5c5]" />
                                    <div class="h-2.5 w-36 rounded bg-[#e8e0d0]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
