<script setup>
import { onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useHelpers } from '@/composables/useHelpers';
import { useWishlistStore } from '@/stores/wishlist';
import { useProductStore } from '@/stores/catalog/product';

const { t, locale } = useI18n();
const toast = useToast();
const { translateItemField } = useHelpers();
const wishlistStore = useWishlistStore();
const productStore = useProductStore();

const storeUrl = zucConfig.store_url;
const thumbSize = zucConfig.medium_image_size || 280;

onMounted(async () => {
    await wishlistStore.fetchWishlist();
});

const items = computed(() => wishlistStore.items);

const getProductName = (item) => translateItemField(item, 'name', locale.value);
const getProductSlug = (item) => translateItemField(item, 'slug', locale.value);

const getImageSrc = (item) => {
    const src = item.images?.[0]?.src;
    return src && src !== 'no-image.png'
        ? `${storeUrl}/storage/${thumbSize}/${src}`
        : '/images/placeholder.webp';
};

const removeItem = async (productId) => {
    try {
        await wishlistStore.toggleProduct(productId);
        toast.success(t('Removed from wishlist'));
    } catch {
        toast.error(t('Failed to remove item'));
    }
};

const clearAll = async () => {
    try {
        await wishlistStore.clearAll();
        toast.success(t('Wishlist cleared'));
    } catch {
        toast.error(t('Failed to clear wishlist'));
    }
};
</script>

<template>
    <div>
        <div class="border border-[#e0d8c8] rounded-lg bg-[var(--ds-white)]">
            <div class="px-6 py-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="font-[var(--font-display)] text-lg uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('My Wishlist') }}</h2>
                        <p class="text-sm text-[var(--ds-text-secondary)] mt-1 !mb-0 font-[var(--font-body)]">{{ $t('Products you\'ve saved for later') }}</p>
                    </div>
                    <button
                        v-if="items.length > 0"
                        @click="clearAll"
                        class="text-[var(--ds-sale)] font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors"
                    >
                        {{ $t('Clear all') }}
                    </button>
                </div>

                <!-- Loading -->
                <div v-if="!wishlistStore.loaded" class="flex justify-center py-12">
                    <div class="animate-spin rounded-full h-8 w-8 border-2 border-[#e0d8c8] border-t-[var(--ds-text)]"></div>
                </div>

                <div v-else class="mt-6">
                    <!-- Empty state -->
                    <div v-if="items.length === 0" class="flex flex-col items-center justify-center py-16">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-16 text-[#d0c8b8] mb-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        <p class="font-[var(--font-display)] text-2xl uppercase text-[var(--ds-text)] !mb-0">{{ $t('Your wishlist is empty') }}</p>
                        <p class="text-[var(--ds-text-secondary)] text-sm mt-1 !mb-0 font-[var(--font-body)]">{{ $t('Browse products and add your favorites here') }}</p>
                        <LocalizedLink to="/" class="mt-4 text-sm font-[var(--font-label)] uppercase tracking-wider bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] px-6 py-2.5 rounded-lg transition-colors">
                            {{ $t('Continue shopping') }}
                        </LocalizedLink>
                    </div>

                    <!-- Wishlist items -->
                    <div v-else class="space-y-4">
                        <div
                            v-for="item in items"
                            :key="item.id"
                            class="flex items-center gap-4 sm:gap-6 rounded-lg border border-[#e0d8c8] bg-[var(--ds-white)] p-4 hover:border-[var(--ds-accent)]/30 transition-colors"
                        >
                            <!-- Image -->
                            <LocalizedLink :to="`/product/${getProductSlug(item)}`" class="shrink-0">
                                <img
                                    :src="getImageSrc(item)"
                                    :alt="getProductName(item)"
                                    class="size-20 sm:size-24 object-contain rounded border border-[#e0d8c8] bg-[var(--ds-neutral)] p-2"
                                    @error.once="e => e.target.src = '/images/placeholder.webp'"
                                />
                            </LocalizedLink>

                            <!-- Info -->
                            <div class="flex-1 min-w-0">
                                <LocalizedLink
                                    :to="`/product/${getProductSlug(item)}`"
                                    class="text-sm font-[var(--font-body)] text-[var(--ds-text)] hover:text-[var(--ds-accent)] transition-colors line-clamp-2"
                                >
                                    {{ getProductName(item) }}
                                </LocalizedLink>
                                <p v-if="item.sku" class="font-[var(--font-label)] text-xs uppercase tracking-wider text-[var(--ds-text-secondary)] mt-1 !mb-0">SKU: {{ item.sku }}</p>
                                <div class="mt-2 font-[var(--font-display)] text-[var(--ds-text)]">
                                    <PriceConverter :product="item" />
                                </div>
                            </div>

                            <!-- Remove button -->
                            <button
                                @click="removeItem(item.product_id)"
                                class="shrink-0 p-2 text-[var(--ds-text-secondary)] hover:text-[var(--ds-sale)] transition-colors"
                                :title="$t('Remove')"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
